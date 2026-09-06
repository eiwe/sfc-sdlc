import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildInvocation, parseHarnessOutput, runNative } from "../skills/adopt/templates/scripts/sdlc/runner.mjs";

const result = { decision: "advance", summary: "Inspected the acceptance criteria and exact revision." };
const request = { version: 1, runId: "fresh-123", role: "reviewer", stage: "review", task: "Review the change", repo: process.cwd(), change: "demo", revision: "abc", artifacts: {}, persona: "Security specialist" };
const lines = (...events) => events.map((event) => JSON.stringify(event)).join("\n") + "\n";
const codexOutput = lines({ type: "thread.started", thread_id: "new" }, { type: "item.completed", item: { type: "agent_message", text: JSON.stringify(result) } }, { type: "turn.completed" });
const piMessage = { role: "assistant", stopReason: "stop", content: [{ type: "text", text: JSON.stringify(result) }] };
const piLoop = (message = piMessage) => [
  { type: "agent_start" }, { type: "turn_start" },
  { type: "message_start", message: { ...message, content: [] } },
  { type: "message_end", message },
  { type: "turn_end", message, toolResults: [] },
  { type: "agent_end", messages: [message], willRetry: false },
];
const piOutput = lines(...piLoop());
const openOutput = lines({ type: "step_start", part: { messageID: "m1" } }, { type: "text", part: { messageID: "m1", text: JSON.stringify(result) } }, { type: "step_finish", part: { messageID: "m1", reason: "stop" } });

test("fresh native invocations preserve role/persona/model without shell interpretation", () => {
  const model = "provider/model-$(touch should-not-exist)";
  for (const harness of ["codex", "claude", "pi", "opencode"]) {
    const invocation = buildInvocation(harness, request, model);
    assert.equal(invocation.command, harness);
    assert.equal(invocation.cwd, request.repo);
    assert.equal(invocation.args.at(-1), model);
    assert.match(invocation.input, /Security specialist/);
    assert.match(invocation.input, /Do not edit, commit, repair/);
    assert.equal(invocation.args.some((arg) => ["--resume", "--continue", "--auto", "--dangerously-bypass-approvals-and-sandbox", "--dangerously-bypass-hook-trust"].includes(arg)), false);
  }
  assert.ok(buildInvocation("codex", request).args.includes("read-only"));
  assert.ok(buildInvocation("codex", { ...request, role: "implementer" }).args.includes("workspace-write"));
  assert.ok(buildInvocation("pi", request).args.includes("--no-session"));
});

test("runner validates configuration and request before any native invocation", () => {
  assert.throws(() => buildInvocation("other", request), /Unsupported/);
  for (const invalid of [{ ...request, version: 2 }, { ...request, repo: "relative" }, { ...request, role: "owner" }, { ...request, task: "" }])
    assert.throws(() => buildInvocation("codex", invalid), /Invalid/);
});

test("all four native success envelopes yield the same controller result", () => {
  assert.deepEqual(parseHarnessOutput("codex", codexOutput), result);
  assert.deepEqual(parseHarnessOutput("claude", JSON.stringify({ type: "result", subtype: "success", is_error: false, structured_output: result })), result);
  assert.deepEqual(parseHarnessOutput("claude", JSON.stringify({ type: "result", subtype: "success", result: JSON.stringify(result) })), result);
  assert.deepEqual(parseHarnessOutput("pi", piOutput), result);
  assert.deepEqual(parseHarnessOutput("opencode", openOutput), result);
});

test("tool output cannot masquerade as the final independent review", () => {
  assert.throws(() => parseHarnessOutput("codex", lines({ type: "item.completed", item: { type: "command_execution", text: JSON.stringify(result) } }, { type: "turn.completed" })), /missing/);
  assert.throws(() => parseHarnessOutput("pi", lines(...piLoop({ ...piMessage, role: "toolResult" }))), /final assistant/);
  assert.throws(() => parseHarnessOutput("opencode", lines({ type: "step_start", part: { messageID: "m1" } }, { type: "tool_use", part: { text: JSON.stringify(result) } }, { type: "step_finish", part: { messageID: "m1", reason: "stop" } })), /missing/);
});

test("Pi accepts current settled lifecycle and legacy completed loops, including successful continuations", () => {
  // Pi 0.84.4 agent-session emits agent_settled after the last core agent_end.
  assert.deepEqual(parseHarnessOutput("pi", piOutput + lines({ type: "agent_settled" })), result);
  assert.deepEqual(parseHarnessOutput("pi", piOutput), result);
  const retry = piLoop({ ...piMessage, stopReason: "error", errorMessage: "retryable failure" });
  retry.at(-1).willRetry = true;
  assert.deepEqual(parseHarnessOutput("pi", lines(...retry, { type: "auto_retry_start", attempt: 1 }, ...piLoop(), { type: "agent_settled" })), result);
});

test("Pi settlement cannot authorize stale, incomplete, failed or mismatched assistant work", () => {
  const settled = { type: "agent_settled" };
  const incomplete = [
    [settled],
    [...piLoop().slice(0, -1), settled],
    [...piLoop(), { type: "agent_start" }, settled],
    [...piLoop(), { type: "agent_start" }, { type: "agent_end", messages: [] }, settled],
    [...piLoop(), { type: "turn_start" }, settled],
    [...piLoop(), settled, { type: "message_start", message: piMessage }],
    [...piLoop(), settled, settled],
    [...piLoop(), { type: "auto_retry_start", attempt: 1 }, settled],
    [...piLoop(), { type: "compaction_end", aborted: true, errorMessage: "failed" }, settled],
    ...["error", "aborted", "length", "toolUse"].map((stopReason) => [...piLoop({ ...piMessage, stopReason }), settled]),
  ];
  const retryPending = piLoop();
  retryPending.at(-1).willRetry = true;
  incomplete.push([...retryPending, settled]);
  for (const index of [3, 4, 5]) {
    const mismatched = piLoop();
    const other = { ...piMessage, content: [{ type: "text", text: JSON.stringify({ decision: "revise", summary: "Different final message" }) }] };
    if (index === 5) mismatched[index].messages = [other];
    else mismatched[index].message = other;
    incomplete.push([...mismatched, settled]);
  }
  // A later unfinished message or turn within the final loop cannot reuse its verdict.
  for (const event of [{ type: "message_start", message: piMessage }, { type: "message_update" }, { type: "tool_execution_start" }, { type: "turn_start" }]) {
    const unfinished = piLoop();
    unfinished.splice(-1, 0, event);
    incomplete.push([...unfinished, settled]);
  }
  for (const events of incomplete) {
    assert.throws(() => parseHarnessOutput("pi", lines(...events)), /Pi/);
    if (events.at(-1) === settled && events.at(-2)?.type !== "agent_settled")
      assert.throws(() => parseHarnessOutput("pi", lines(...events.slice(0, -1))), /Pi/);
  }
});

test("OpenCode decisions belong to the final completed step, never stale or unfinished messages", () => {
  const stale = [
    { type: "step_start", part: { messageID: "earlier" } },
    { type: "text", part: { messageID: "earlier", text: JSON.stringify(result) } },
    { type: "step_finish", part: { messageID: "earlier", reason: "tool-calls" } },
    { type: "step_start", part: { messageID: "final" } },
    { type: "step_finish", part: { messageID: "final", reason: "stop" } },
  ];
  assert.throws(() => parseHarnessOutput("opencode", lines(...stale)), /missing/);
  // Even a reused message ID cannot carry a verdict across a new step boundary.
  assert.throws(() => parseHarnessOutput("opencode", lines(...stale.map((event) => ({ ...event, part: { ...event.part, messageID: "same" } })))), /missing/);
  for (const event of [{ type: "step_start", part: { messageID: "later" } }, { type: "text", part: { messageID: "later", text: JSON.stringify(result) } }])
    assert.throws(() => parseHarnessOutput("opencode", openOutput + lines(event)), /final step/);
  assert.throws(() => parseHarnessOutput("opencode", openOutput.replaceAll('"messageID":"m1"', '"unused":"m1"')), /final step/);
});

test("malformed, truncated, failed and unstructured native output never advances", () => {
  for (const harness of ["codex", "claude", "pi", "opencode"]) assert.throws(() => parseHarnessOutput(harness, "not JSON"));
  assert.throws(() => parseHarnessOutput("codex", codexOutput.replace('"turn.completed"', '"turn.failed"')), /failed/);
  assert.throws(() => parseHarnessOutput("claude", JSON.stringify({ type: "result", subtype: "error_max_turns", structured_output: result })), /successful/);
  assert.throws(() => parseHarnessOutput("claude", JSON.stringify({ type: "result", subtype: "success", result: "Looks good" })));
  assert.throws(() => parseHarnessOutput("pi", piOutput.replaceAll('"stop"', '"length"')), /final assistant/);
  assert.throws(() => parseHarnessOutput("opencode", openOutput.replace('"stop"', '"tool-calls"')), /final step/);
  assert.throws(() => parseHarnessOutput("claude", JSON.stringify({ type: "result", subtype: "success", structured_output: { ...result, passedTests: true } })), /Final result/);
  assert.throws(() => parseHarnessOutput("claude", JSON.stringify({ type: "result", subtype: "success", structured_output: result, mcp_server_errors: [{ name: "required" }] })), /successful/);
});

test("native subprocess uses stdin and checks actual exits, timeout and output bounds", async () => {
  const base = { command: process.execPath, cwd: process.cwd(), input: "literal $(nothing)" };
  const output = await runNative({ ...base, args: ["-e", "process.stdin.pipe(process.stdout)"] });
  assert.equal(output.stdout, base.input);
  await assert.rejects(runNative({ ...base, args: ["-e", "process.exit(7)"] }), /exited 7/);
  await assert.rejects(runNative({ ...base, args: ["-e", "setTimeout(()=>{}, 10000)"] }, { timeoutMs: 30 }), /timed out/);
  await assert.rejects(runNative({ ...base, args: ["-e", "process.stdout.write('a'.repeat(10000))"] }, { maxBytes: 100 }), /exceeded limit/);
  await assert.rejects(runNative({ ...base, command: "sfc-missing-harness-1234", args: [] }), /ENOENT/);
});

test("CLI reports invalid controller input as nonzero with no result", () => {
  const runner = fileURLToPath(new URL("../skills/adopt/templates/scripts/sdlc/runner.mjs", import.meta.url));
  const execution = spawnSync(process.execPath, [runner, "--harness", "codex"], { input: "{}", encoding: "utf8" });
  assert.equal(execution.status, 1);
  assert.equal(execution.stdout, "");
  assert.match(execution.stderr, /Invalid version-1 runner request/);
});

#!/usr/bin/env node
/** Native fresh-session bridge. Trusted operator configuration supplies the CLI
 * installation, model credentials and permissions. This process inherits its
 * environment; it does not provision credentials or establish OS isolation. */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";

const SCHEMA = fileURLToPath(new URL("./runner-result.schema.json", import.meta.url));
const HARNESS = ["codex", "claude", "pi", "opencode"];
const READ_ROLES = new Set(["reviewer", "verifier"]);

export function validateDecision(value) {
  if (!value || Array.isArray(value) || typeof value !== "object" ||
      !["advance", "revise", "escalate"].includes(value.decision) ||
      typeof value.summary !== "string" || !value.summary.trim() ||
      Object.keys(value).some((key) => !["decision", "summary"].includes(key)))
    throw new Error("Final result must be {decision: advance|revise|escalate, summary: nonempty string}");
  return value;
}

export function buildInvocation(harness, request, model) {
  if (!HARNESS.includes(harness)) throw new Error(`Unsupported harness: ${harness}`);
  if (request?.version !== 1 || typeof request.repo !== "string" || !path.isAbsolute(request.repo) ||
      !["planner", "implementer", "reviewer", "verifier"].includes(request.role) ||
      typeof request.task !== "string" || !request.task.trim() || typeof request.stage !== "string")
    throw new Error("Invalid version-1 runner request: absolute repo, task, stage and known role required");
  if (model !== undefined && (typeof model !== "string" || !model.trim())) throw new Error("Model must be a nonempty string");
  const readOnly = READ_ROLES.has(request.role);
  const args = {
    codex: ["exec", "--json", "--ephemeral", "--sandbox", readOnly ? "read-only" : "workspace-write", "--output-schema", SCHEMA, "-"],
    claude: ["-p", "--output-format", "json", "--permission-mode", "dontAsk", "--allowedTools",
      readOnly ? "Read,Glob,Grep,Bash,PowerShell" : "Read,Glob,Grep,Bash,PowerShell,Edit,Write", "--json-schema", readFileSync(SCHEMA, "utf8")],
    pi: ["-p", "--mode", "json", "--no-session", ...(readOnly ? ["--tools", "read,bash,grep,find,ls"] : [])],
    opencode: ["run", "--format", "json"],
  }[harness];
  if (model) args.push("--model", model);
  const prompt = [
    `You are a fresh independent ${request.role} invocation at SDLC stage ${request.stage}.`,
    "Read AGENTS.md, WORKFLOW.md and the requested change artifacts. Follow the task's accepted scope and recorded authorization.",
    readOnly ? "Inspect and report only. Do not edit, commit, repair, or mutate the submitted tree." : "Produce the stage's requested artifacts or implementation. Do not commit; the controller records and commits accepted stage output.",
    "Do not modify controller policy/runtime/evidence or manufacture another agent's approval. Personas affect expertise, not authority.",
    "Advance when your assigned stage is complete; revise for actionable defects; escalate only for an explicit policy/authority boundary or unmet prerequisite.",
    "Your final answer MUST be only JSON: {\"decision\":\"advance\"|\"revise\"|\"escalate\",\"summary\":\"evidence, findings, or decision needed\"}. No markdown fences.",
    "The controller runs deterministic verification independently; a claim that tests passed does not substitute for those checks.",
    request.persona ? `Task-scoped expertise: ${request.persona}` : "",
    "Controller request:", JSON.stringify(request),
  ].filter(Boolean).join("\n\n");
  return { command: harness, args, cwd: request.repo, input: prompt };
}

/** Parse only the authoritative native final-message location. Never scan tool
 * output or arbitrary nested JSON for a convenient 'advance' decision. */
export function parseHarnessOutput(harness, output) {
  if (!HARNESS.includes(harness)) throw new Error(`Unsupported harness: ${harness}`);
  if (harness === "claude") {
    const result = JSON.parse(output);
    if (result.type !== "result" || result.is_error || result.subtype !== "success" || result.mcp_server_errors?.length)
      throw new Error("Claude result is not a successful completed invocation");
    return validateDecision(result.structured_output ?? JSON.parse(result.result));
  }
  const events = output.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
  if (events.some((event) => ["error", "turn.failed"].includes(event.type))) throw new Error(`${harness} reported a failed run`);
  let finalText;
  if (harness === "codex") {
    if (events.at(-1)?.type !== "turn.completed") throw new Error("Codex run has no completed turn");
    finalText = events.filter((event) => event.type === "item.completed" && event.item?.type === "agent_message").at(-1)?.item.text;
  } else if (harness === "pi") {
    // Pi 0.84.4 adds agent_settled in a finally block after all automatic
    // continuations. It is not success evidence: require the actual final loop.
    const endIndex = events.length - (events.at(-1)?.type === "agent_settled" ? 2 : 1);
    const end = events[endIndex];
    const start = events.findLastIndex((event) => event.type === "agent_start");
    if (end?.type !== "agent_end" || !Array.isArray(end.messages) ||
        ![undefined, false].includes(end.willRetry) || start < 0 || start >= endIndex)
      throw new Error("Pi run has no completed final agent loop");
    const loop = events.slice(start + 1, endIndex);
    const turnStart = loop.findLastIndex((event) => event.type === "turn_start");
    const turnEnd = loop.findLastIndex((event) => event.type === "turn_end");
    const work = (event) => /^(message_(start|update|end)|tool_execution_(start|update|end))$/.test(event.type);
    if (loop.some((event) => ["agent_end", "agent_settled"].includes(event.type)) ||
        turnStart < 0 || turnEnd <= turnStart || loop.slice(turnEnd + 1).some(work))
      throw new Error("Pi run has no completed final turn");
    const finalEvent = loop.slice(turnStart + 1, turnEnd).filter(work).at(-1);
    const message = finalEvent?.message;
    // Core Pi emits the same completed message at message_end, turn_end and in
    // agent_end.messages. Bind all three, since Pi messages have no stable ID.
    if (finalEvent?.type !== "message_end" || message?.role !== "assistant" || message.stopReason !== "stop" ||
        !Array.isArray(message.content) || message.content.some((part) => part.type === "toolCall") ||
        !Array.isArray(loop[turnEnd].toolResults) || loop[turnEnd].toolResults.length ||
        !isDeepStrictEqual(message, loop[turnEnd].message) || !isDeepStrictEqual(message, end.messages.at(-1)))
      throw new Error("Pi has no successful final assistant message");
    finalText = message.content.filter((part) => part.type === "text").map((part) => part.text).join("");
  } else {
    const finish = events.at(-1);
    const finalMessage = finish?.part?.messageID;
    const start = events.findLastIndex((event) => event.type === "step_start");
    if (finish?.type !== "step_finish" || finish.part.reason !== "stop" ||
        typeof finalMessage !== "string" || !finalMessage || start < 0 ||
        events[start].part?.messageID !== finalMessage) throw new Error("OpenCode run has no successful final step");
    // Only text produced by this completed step can authorize the gate. Earlier
    // assistant text may include a provisional verdict before more tool calls.
    finalText = events.slice(start + 1, -1)
      .filter((event) => event.type === "text" && event.part?.messageID === finalMessage && typeof event.part.text === "string")
      .map((event) => event.part.text).join("");
  }
  if (typeof finalText !== "string" || !finalText.trim()) throw new Error(`${harness} final assistant output is missing`);
  return validateDecision(JSON.parse(finalText));
}

export async function runNative(invocation, { timeoutMs = 600000, maxBytes = 8 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, { cwd: invocation.cwd, shell: false, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", size = 0, failure;
    const fail = (message) => { failure ??= new Error(message); child.kill("SIGKILL"); };
    const timer = setTimeout(() => fail("Native harness timed out"), timeoutMs);
    const terminate = () => fail("Native runner interrupted");
    process.once("SIGTERM", terminate);
    process.once("SIGINT", terminate);
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { size += Buffer.byteLength(chunk); if (size > maxBytes) fail("Native harness output exceeded limit"); else stdout += chunk; });
    child.stderr.on("data", (chunk) => { size += Buffer.byteLength(chunk); if (size > maxBytes) fail("Native harness output exceeded limit"); else stderr += chunk; });
    child.stdin.on("error", (error) => { if (error.code !== "EPIPE") fail(error.message); });
    child.on("error", (error) => { failure = error; });
    child.on("close", (code, signal) => {
      clearTimeout(timer); process.removeListener("SIGTERM", terminate); process.removeListener("SIGINT", terminate);
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error(`Native harness exited ${code ?? signal}: ${stderr.slice(-4000)}`));
      else resolve({ stdout, stderr });
    });
    child.stdin.end(invocation.input);
  });
}

async function main() {
  try {
    const options = {};
    for (let i = 2; i < process.argv.length; i += 2) {
      const flag = process.argv[i];
      if (!["--harness", "--model"].includes(flag) || !process.argv[i + 1] || options[flag]) throw new Error("Usage: runner.mjs --harness codex|claude|pi|opencode [--model MODEL]");
      options[flag] = process.argv[i + 1];
    }
    let raw = "";
    for await (const chunk of process.stdin) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 1024 * 1024) throw new Error("Runner request exceeds 1 MiB");
    }
    const invocation = buildInvocation(options["--harness"], JSON.parse(raw), options["--model"]);
    const output = await runNative(invocation);
    if (output.stderr) process.stderr.write(output.stderr);
    process.stdout.write(`${JSON.stringify(parseHarnessOutput(options["--harness"], output.stdout))}\n`);
  } catch (error) {
    process.stderr.write(`SDLC runner error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

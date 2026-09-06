import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runWorkflow, validatePolicy, execute } from "../skills/adopt/templates/scripts/sdlc/controller.mjs";

const worker = fileURLToPath(new URL("./fixtures/workflow-worker.mjs", import.meta.url));
function fixture(t, scenario = "happy", overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sdlc-controller-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo"); fs.mkdirSync(repo);
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "-q"); git("config", "user.name", "SDLC Fixture"); git("config", "user.email", "fixture@example.invalid");
  fs.writeFileSync(path.join(repo, "README.md"), "# Fixture\n"); git("add", "."); git("commit", "-qm", "initial");
  const command = [process.execPath, worker, scenario];
  const policy = {
    version: 1, mode: "cooperative", runners: Object.fromEntries(["planner", "implementer", "verifier", "reviewer"].map((r) => [r, command])),
    verify: [process.execPath, worker, "check-env"], allowedPaths: ["src/", "tests/", "docs/", "HANDOFF.md", "CHANGELOG.md", ".github/"],
    protectedPaths: [".github/"], maxAttempts: 2, maxInvocations: 30, timeoutMs: 3000, maxElapsedMs: 30000, ...overrides,
  };
  const policyFile = path.join(root, "policy.json"), stateFile = path.join(root, "run.json");
  fs.writeFileSync(policyFile, JSON.stringify(policy));
  const options = { repo, change: "fixture", policyFile, stateFile, task: "Produce the result 42 with independent proof." };
  return { root, repo, git, options, policy, run: () => runWorkflow(options) };
}

test("bounded task completes all independent gates without human messages", async (t) => {
  const f = fixture(t); const state = await f.run();
  assert.equal(state.status, "ready", state.reason);
  assert.deepEqual(state.history.map((x) => x.stage), ["intent", "intent-review", "design", "design-review", "plan", "plan-review", "build", "check", "verification", "review"]);
  assert.equal(new Set(state.history.map((x) => x.runId)).size, state.history.length);
  assert.notEqual(state.approvals.verification.runId, state.approvals.review.runId);
  assert.equal(state.approvals.review.revision, f.git("rev-parse", "HEAD"));
  assert.ok(state.history.find((x) => x.stage === "check").stdout.includes("Acceptance check passed"));
  assert.equal((await f.run()).invocations, state.invocations, "completed run is idempotent");
});
test("failed actual verification repairs code and reruns proof", async (t) => {
  const state = await fixture(t, "repair").run();
  assert.equal(state.status, "ready", state.reason);
  assert.equal(state.history.filter((x) => x.stage === "build").length, 2);
  assert.deepEqual(state.history.filter((x) => x.stage === "check").map((x) => x.code), [1, 0]);
});
test("independent plan feedback returns to its producer", async (t) => {
  const state = await fixture(t, "revise").run();
  assert.equal(state.status, "ready", state.reason);
  assert.equal(state.history.filter((x) => x.stage === "plan").length, 2);
});
test("unresolved disagreement has a bounded repair loop", async (t) => {
  const state = await fixture(t, "disagree").run();
  assert.equal(state.status, "escalated");
  assert.match(state.reason, /budget/);
});
for (const [scenario, reason] of [["protected", /Protected change/], ["out-of-scope", /Out-of-scope/], ["early-code", /artifact boundary/], ["stale-plan", /Approved artifact changed/], ["mutating-review", /modified its submission/], ["malformed", /Invalid JSON/], ["escalate", /intent-review/]]) {
  test(`${scenario} cannot advance to integration`, async (t) => {
    const state = await fixture(t, scenario).run();
    assert.equal(state.status, "escalated"); assert.match(state.reason, reason);
    assert.ok(!state.history.some((x) => x.stage === "integration"));
  });
}
test("timeout is captured and does not advance", async (t) => {
  const state = await fixture(t, "timeout", { timeoutMs: 200 }).run();
  assert.equal(state.status, "escalated"); assert.match(state.reason, /timeout/);
});
test("dirty or changed revision invalidates completed evidence", async (t) => {
  const f = fixture(t); const state = await f.run(); assert.equal(state.status, "ready");
  fs.writeFileSync(path.join(f.repo, "src/result.txt"), "changed\n");
  const resumed = await f.run(); assert.equal(resumed.status, "escalated"); assert.match(resumed.reason, /stale/);
});
test("policy cannot change silently on resume", async (t) => {
  const f = fixture(t); await f.run();
  fs.writeFileSync(f.options.policyFile, JSON.stringify({ ...f.policy, maxAttempts: 100 }));
  const state = await f.run(); assert.equal(state.status, "escalated"); assert.match(state.reason, /policy changed/);
});
test("existing controller lock prevents concurrent invocation", async (t) => {
  const f = fixture(t); fs.writeFileSync(`${f.options.stateFile}.lock`, "another controller");
  await assert.rejects(f.run(), /locked/);
});
test("state cannot live in the worker checkout", async (t) => {
  const f = fixture(t); f.options.stateFile = path.join(f.repo, "run.json");
  await assert.rejects(f.run(), /outside/);
});
test("elapsed budgets persist across checkpoints", async (t) => {
  const f = fixture(t); const state = await f.run();
  state.status = "running"; state.stage = "review"; state.startedAt = "2000-01-01T00:00:00Z";
  fs.writeFileSync(f.options.stateFile, JSON.stringify(state));
  const resumed = await f.run(); assert.equal(resumed.status, "escalated"); assert.match(resumed.reason, /budget/);
});
test("interrupted integration is never blindly retried", async (t) => {
  const f = fixture(t); const state = await f.run();
  state.status = "running"; state.pending = { stage: "integration", runId: "interrupted" };
  fs.writeFileSync(f.options.stateFile, JSON.stringify(state));
  const resumed = await f.run(); assert.equal(resumed.status, "escalated"); assert.match(resumed.reason, /indeterminate/);
  assert.equal(resumed.invocations, state.invocations);
});
test("fix workflow records failing tests before implementation and freezes them", async (t) => {
  const f = fixture(t, "happy", { taskKind: "fix", testPaths: ["tests/"] });
  const state = await f.run(); assert.equal(state.status, "ready", state.reason);
  assert.deepEqual(state.regression.paths, ["tests/expected.txt"]);
  assert.equal(state.history.find((x) => x.stage === "regression-check").code, 1);
});
test("a fix cannot weaken a committed regression test", async (t) => {
  const state = await fixture(t, "weaken-test", { taskKind: "fix", testPaths: ["tests/"] }).run();
  assert.equal(state.status, "escalated"); assert.match(state.reason, /Regression baseline/);
});
test("verification must not mutate a reviewed tree", async (t) => {
  const state = await fixture(t, "happy", { verify: [process.execPath, worker, "check-mutation"] }).run();
  assert.equal(state.status, "escalated"); assert.match(state.reason, /mutated/);
});
test("worker secrets are not forwarded to verification by default", async (t) => {
  const previous = process.env.SDLC_TEST_SECRET; process.env.SDLC_TEST_SECRET = "fixture-secret";
  t.after(() => { if (previous === undefined) delete process.env.SDLC_TEST_SECRET; else process.env.SDLC_TEST_SECRET = previous; });
  const state = await fixture(t).run(); assert.equal(state.status, "ready", state.reason);
});
test("explicit integration runs once after exact revision approvals", async (t) => {
  const f = fixture(t, "happy", { allowIntegration: true, integrate: [process.execPath, "-e", 'process.stdin.resume(); process.stdin.on("end",()=>console.log("fixture integration"))'] });
  const state = await f.run(); assert.equal(state.status, "complete", state.reason);
  assert.equal(state.history.at(-1).stage, "integration");
  assert.equal((await f.run()).invocations, state.invocations);
});
test("policy rejects unconfigured checks and unapproved integration", (t) => {
  const f = fixture(t);
  assert.throws(() => validatePolicy({ ...f.policy, verify: [] }), /verify/);
  assert.throws(() => validatePolicy({ ...f.policy, integrate: ["merge"] }), /allowIntegration/);
  assert.throws(() => validatePolicy({ ...f.policy, allowedPaths: ["../escape"] }), /relative/);
});
test("runner output is bounded", async (t) => {
  const f = fixture(t);
  const result = await execute([process.execPath, "-e", 'process.stdout.write("x".repeat(10000))'], { repo: f.repo, timeoutMs: 2000, maxOutputBytes: 100 });
  assert.equal(result.error, "output limit exceeded"); assert.equal(result.stdout, "");
});

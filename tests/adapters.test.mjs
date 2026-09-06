import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, cpSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { guardPayload, normalizeEvent, patchPaths, targetsProtectedBranch, isProductionCommand } from "../skills/adopt/templates/scripts/sdlc/guards.mjs";

const templates = fileURLToPath(new URL("../skills/adopt/templates/", import.meta.url));
const guardUrl = new URL("../skills/adopt/templates/scripts/sdlc/guards.mjs", import.meta.url).href;
const protectedEnv = { SDLC_PROTECT_TESTS: "1" };
function shell(command, cwd) { return { tool_name: "Bash", tool_input: { command }, ...(cwd ? { cwd } : {}) }; }

test("all four harness payloads protect the same regression test", () => {
  const payloads = [
    ["claude", { tool_name: "Edit", tool_input: { file_path: "tests/regression.js" } }],
    ["codex", { tool_name: "apply_patch", tool_input: { command: "*** Begin Patch\n*** Update File: tests/regression.js\n@@\n-old\n+new\n*** End Patch" } }],
    ["pi", { toolName: "edit", input: { path: "tests/regression.js", oldText: "old", newText: "new" } }],
    ["opencode", { tool: "write", args: { filePath: "tests/regression.js", content: "new" } }],
  ];
  for (const [harness, payload] of payloads) {
    assert.equal(guardPayload(payload, { harness, env: protectedEnv }).allow, false, harness);
    assert.deepEqual(normalizeEvent(payload, harness).paths, ["tests/regression.js"]);
  }
});

test("Codex patch extraction checks every file, deletes, and both sides of a move", () => {
  const patch = "*** Begin Patch\n*** Add File: src/a.js\n+ok\n*** Update File: src/b.js\n*** Move to: tests/moved.js\n@@\n-a\n+b\n*** Delete File: tests/deleted.js\n*** End Patch";
  assert.deepEqual(patchPaths(patch), ["src/a.js", "src/b.js", "tests/moved.js", "tests/deleted.js"]);
  assert.equal(guardPayload({ tool_name: "apply_patch", tool_input: { command: patch } }, { env: protectedEnv }).allow, false);
  const fromTest = patch.replace("src/b.js", "tests/b.js").replace("tests/moved.js", "src/moved.js");
  assert.equal(guardPayload({ tool_name: "apply_patch", tool_input: { command: fromTest } }, { env: protectedEnv }).allow, false);
  assert.throws(() => patchPaths("arbitrary text"), /malformed/);
});

test("PowerShell and OpenCode patchText normalization are covered", () => {
  for (const name of ["PowerShell", "powershell"]) assert.equal(guardPayload({ tool_name: name, tool_input: { command: "git push origin main" } }, { env: {} }).allow, false);
  assert.deepEqual(normalizeEvent({ tool: "apply_patch", args: { patchText: "*** Begin Patch\n*** Delete File: tests/a.js\n*** End Patch" } }).paths, ["tests/a.js"]);
});

test("malformed known payloads/configurations block and unknown tool coverage is explicit", () => {
  for (const payload of [null, {}, { toolName: "edit", input: {} }, { toolName: "bash", input: { command: 42 } }])
    assert.equal(guardPayload(payload, { env: {} }).allow, false);
  assert.equal(guardPayload(shell("git status"), { env: { SDLC_PROTECTED_BRANCHES: " , " } }).allow, false);
  assert.equal(guardPayload(shell("git status"), { env: { SDLC_PRODUCTION_PATTERN: "[" } }).allow, false);
  assert.equal(guardPayload(shell("git status"), { env: { SDLC_TEST_PATTERN: "[" } }).allow, false);
  assert.deepEqual(guardPayload({ tool_name: "mcp__custom__edit", tool_input: {} }, { env: protectedEnv }), { allow: true, coverage: "unknown" });
  assert.deepEqual(guardPayload(shell("node arbitrary-script.js"), { env: protectedEnv }), { allow: true, coverage: "heuristic" });
});

test("push preflight recognizes global options, full destinations, ambiguity and source/destination distinction", () => {
  for (const command of ["git -C . push origin main", "git -c color.ui=false push origin HEAD:refs/heads/main", "git push --all", "git push", "git push origin", "git push --mirror origin", "git push origin +feature:main", "git push --repo origin HEAD:main", "git push origin 'refs/heads/*:refs/heads/*'", "git status && git push origin HEAD:main"]) assert.equal(targetsProtectedBranch(command), true, command);
  for (const command of ["git push origin main:feature", "git push origin HEAD:refs/heads/feature", "git push -n origin main", "git -C . push --repo=origin HEAD:feature", "echo 'git push origin main'"]) assert.equal(targetsProtectedBranch(command), false, command);
});

test("context-sensitive deployment warnings distinguish read commands, including compound commands", () => {
  for (const command of ["terraform apply", "terraform -chdir=infra apply", "kubectl --context staging apply -f a.yaml", "helm upgrade app chart", "kubectl rollout restart deployment/app", "kubectl get pods; kubectl apply -f a.yaml"])
    assert.ok(isProductionCommand(command), command);
  for (const command of ["kubectl get pods --context production", "terraform plan -out=apply", "helm list --namespace production", "kubectl get deployment release -n production", "kubectl rollout status deployment/app -n production"])
    assert.equal(isProductionCommand(command), null, command);
});

test("production acknowledgement is exact, expiring and no longer accepts an arbitrary ticket string", () => {
  const payload = shell("terraform apply", process.cwd());
  const approval = { command: "terraform apply", cwd: process.cwd(), expires: new Date(Date.now() + 60000).toISOString(), reference: "CHG-1" };
  const check = (value) => guardPayload(payload, { env: { SDLC_RELEASE_APPROVAL: typeof value === "string" ? value : JSON.stringify(value) } });
  assert.equal(check(approval).allow, true);
  assert.equal(check("CHG-1").allow, false);
  assert.equal(check({ ...approval, command: "terraform destroy" }).allow, false);
  assert.equal(check({ ...approval, cwd: path.dirname(process.cwd()) }).allow, false);
  assert.equal(check({ ...approval, expires: "2000-01-01T00:00:00Z" }).allow, false);
  assert.equal(check({ ...approval, reference: "" }).allow, false);
});

test("native Pi extension returns block and OpenCode plugin throws before protected pushes", async () => {
  async function load(relative) {
    const source = readFileSync(path.join(templates, relative), "utf8").replace("../../scripts/sdlc/guards.mjs", guardUrl);
    return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  }
  const pi = await load("dot-pi/extensions/sdlc.ts");
  let callback;
  pi.default({ on: (event, handler) => { assert.equal(event, "tool_call"); callback = handler; } });
  const result = await callback({ toolName: "bash", input: { command: "git push origin main" } }, { cwd: process.cwd() });
  assert.equal(result.block, true);
  const opencode = await load("dot-opencode/plugins/sdlc.js");
  const hooks = await opencode.SdlcPlugin({ directory: process.cwd() });
  await assert.rejects(hooks["tool.execute.before"]({ tool: "bash" }, { args: { command: "git push origin main" } }), /push destination/);
  await hooks["tool.execute.before"]({ tool: "bash" }, { args: { command: "git status" } });
});

test("Codex configured command resolves scripts from a nested repository cwd", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "sfc-codex-hook-"));
  try {
    assert.equal(spawnSync("git", ["init", "-q", dir]).status, 0);
    mkdirSync(path.join(dir, "nested"));
    cpSync(path.join(templates, "scripts"), path.join(dir, "scripts"), { recursive: true });
    const config = JSON.parse(readFileSync(path.join(templates, "dot-codex/hooks.json"), "utf8"));
    const command = config.hooks.PreToolUse[0].hooks[0].command;
    const env = { ...process.env }; for (const key of Object.keys(env)) if (key.startsWith("SDLC_")) delete env[key];
    const result = spawnSync(command, { cwd: path.join(dir, "nested"), shell: true, input: JSON.stringify(shell("git push origin main")), encoding: "utf8", env });
    assert.equal(result.status, 2, result.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

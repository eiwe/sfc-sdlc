import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { adopt } from "../skills/adopt/scripts/adopt.mjs";

const ownHook = { matcher: "Bash", hooks: [{ type: "command", command: "node scripts/sdlc/hooks.mjs" }] };
const userHook = { matcher: "Write", hooks: [{ type: "command", command: "user-check" }] };
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function write(root, relative, content) {
  const filename = path.join(root, relative);
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, content);
}

async function setup(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sfc-adopt-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const target = path.join(root, "target");
  const templates = path.join(root, "templates");
  const payload = {
    "AGENTS.md": "# Shared SDLC\n",
    "CLAUDE.md": "@AGENTS.md\n",
    "ROLES.md": "# Roles\n",
    "WORKFLOW.md": "# Workflow\n",
    "INTENT.md": "# Intent\n",
    "SPEC.md": "# Spec\n",
    "PLAN.md": "# Plan\n",
    "ADR.md": "# Decision\n",
    "dot-github/CODEOWNERS": "* @OWNER\n",
    "dot-github/workflows/ci.yml": "jobs:\n  verify:\n    steps:\n      - run: |\n          # SDLC_VERIFY_COMMAND_BEGIN\n          echo 'SDLC verification command is incomplete'\n          exit 1\n          # SDLC_VERIFY_COMMAND_END\n",
    "dot-claude/settings.json": json({ hooks: { PreToolUse: [ownHook] } }),
    "dot-claude/hooks/guard-tests.mjs": "// Claude wrapper\n",
    "dot-codex/hooks.json": json({ hooks: { PreToolUse: [ownHook] } }),
    "dot-pi/extensions/sdlc.ts": "export default function extension() {}\n",
    "dot-opencode/plugins/sdlc.js": "export const Sdlc = async () => ({});\n",
    "dot-sdlc/policy.json": json({ verify: [] }),
    "scripts/sdlc/controller.mjs": "// Controller runtime\n",
    "scripts/sdlc/hooks.mjs": "// Shared hook runtime\n",
  };
  for (const [filename, content] of Object.entries(payload)) await write(templates, filename, content);
  return { root, target, templates };
}

test("preview creates nothing, including a previously absent target", async (t) => {
  const options = await setup(t);
  const report = await adopt(options);
  assert.equal(report.mode, "preview");
  assert.ok(report.changes.some((entry) => entry.path === ".sdlc/installation.json"));
  await assert.rejects(fs.stat(options.target), { code: "ENOENT" });
});

test("fresh adoption installs all native adapters, shared runtime, relocated documents and versioned hashes", async (t) => {
  const options = await setup(t);
  const result = await adopt({ ...options, apply: true });
  assert.equal(result.ok, true);
  const manifest = JSON.parse(await fs.readFile(path.join(options.target, ".sdlc/installation.json"), "utf8"));
  assert.equal(manifest.version, "0.2.0");
  for (const filename of [".claude/settings.json", ".codex/hooks.json", ".pi/extensions/sdlc.ts", ".opencode/plugins/sdlc.js", "scripts/sdlc/controller.mjs", "ROLES.md", "WORKFLOW.md", "docs/decisions/ADR-template.md", "docs/changes/_template/intent.md"]) {
    assert.match(manifest.files[filename].sha256, /^[a-f0-9]{64}$/);
    await fs.access(path.join(options.target, filename));
  }
  await assert.rejects(fs.stat(path.join(options.target, "dot-claude")), { code: "ENOENT" });
});

test("only selected adapters are installed and selection is retained on rerun", async (t) => {
  const options = await setup(t);
  await adopt({ ...options, harnesses: ["pi"], apply: true });
  await assert.rejects(fs.stat(path.join(options.target, ".claude")), { code: "ENOENT" });
  await assert.rejects(fs.stat(path.join(options.target, ".codex")), { code: "ENOENT" });
  const report = await adopt(options);
  assert.deepEqual(report.harnesses, ["pi"]);
  assert.deepEqual(report.changes, []);
});

test("an existing AGENTS.md is preserved and cannot masquerade as adoption", async (t) => {
  const options = await setup(t);
  await write(options.target, "AGENTS.md", "User's established rules\n");
  const doctor = await adopt({ ...options, doctor: true });
  assert.equal(doctor.ok, false);
  assert.ok(doctor.incomplete.some((line) => line.includes("No .sdlc/installation.json")));
  const result = await adopt({ ...options, apply: true });
  assert.ok(result.conflicts.some((entry) => entry.path === "AGENTS.md"));
  assert.equal(await fs.readFile(path.join(options.target, "AGENTS.md"), "utf8"), "User's established rules\n");
});

test("explicitly accepted document merges survive reruns and require review after upstream changes", async (t) => {
  const options = await setup(t);
  const custom = "# Shared SDLC and project-specific rules\n";
  await write(options.target, "AGENTS.md", custom);
  const result = await adopt({ ...options, apply: true, acceptExisting: ["AGENTS.md"] });
  assert.equal(result.ok, true);
  const again = await adopt({ ...options, apply: true });
  assert.equal(again.ok, true);
  assert.deepEqual(again.changes, []);
  assert.equal(await fs.readFile(path.join(options.target, "AGENTS.md"), "utf8"), custom);
  await write(options.templates, "AGENTS.md", "# New upstream policy\n");
  const updated = await adopt({ ...options, apply: true });
  assert.ok(updated.conflicts.some((entry) => entry.path === "AGENTS.md"));
  assert.equal(await fs.readFile(path.join(options.target, "AGENTS.md"), "utf8"), custom);
  await assert.rejects(adopt({ ...options, acceptExisting: ["scripts/sdlc/controller.mjs"] }), /Cannot accept custom executable/);
});

test("accepting custom CI cannot hide unresolved placeholders from doctor", async (t) => {
  const options = await setup(t);
  await adopt({ ...options, apply: true });
  await adopt({ ...options, apply: true, verifyCommand: "npm test", owner: "@someone", acceptExisting: [".github/workflows/ci.yml", ".github/CODEOWNERS"] });
  const report = await adopt({ ...options, doctor: true });
  assert.equal(report.ok, false);
  assert.ok(report.incomplete.some((line) => line.includes("Installed CI")));
  assert.ok(report.incomplete.some((line) => line.includes("Installed CODEOWNERS")));
});

test("doctor requires the full marked executable CI command, including every verification line", async (t) => {
  const options = await setup(t);
  await adopt({ ...options, apply: true, verifyCommand: "npm ci\nnpm test", owner: "@someone" });
  const missingTest = "jobs:\n  verify:\n    steps:\n      - run: |\n          # SDLC_VERIFY_COMMAND_BEGIN\n          npm ci\n          # SDLC_VERIFY_COMMAND_END\n";
  const commentsOnly = "# npm ci\n# npm test\njobs:\n  verify:\n    steps:\n      - run: echo success\n";
  for (const content of [missingTest, commentsOnly]) {
    await write(options.target, ".github/workflows/ci.yml", content);
    await adopt({ ...options, apply: true, acceptExisting: [".github/workflows/ci.yml"] });
    const report = await adopt({ ...options, doctor: true });
    assert.equal(report.ok, false);
    assert.ok(report.incomplete.some((line) => line.includes("complete configured command")));
  }
});

test("Claude and Codex hook settings merge without changing unrelated permissions or duplicating hooks", async (t) => {
  const options = await setup(t);
  for (const filename of [".claude/settings.json", ".codex/hooks.json"]) {
    await write(options.target, filename, json({ permissions: { allow: ["Read"] }, hooks: { PreToolUse: [userHook] } }));
  }
  assert.equal((await adopt({ ...options, apply: true })).ok, true);
  const again = await adopt({ ...options, apply: true });
  assert.deepEqual(again.changes, []);
  for (const filename of [".claude/settings.json", ".codex/hooks.json"]) {
    const settings = JSON.parse(await fs.readFile(path.join(options.target, filename), "utf8"));
    assert.deepEqual(settings.permissions, { allow: ["Read"] });
    assert.deepEqual(settings.hooks.PreToolUse, [userHook, ownHook]);
  }
});

test("hook upgrades replace only owned groups and retain subsequently added user settings", async (t) => {
  const options = await setup(t);
  await adopt({ ...options, apply: true });
  await write(options.target, ".claude/settings.json", json({ enabledPlugins: { custom: true }, hooks: { PreToolUse: [ownHook, userHook] } }));
  const upgraded = { matcher: "Bash|PowerShell", hooks: ownHook.hooks };
  await write(options.templates, "dot-claude/settings.json", json({ hooks: { PreToolUse: [upgraded] } }));
  const result = await adopt({ ...options, apply: true });
  assert.equal(result.ok, true);
  const settings = JSON.parse(await fs.readFile(path.join(options.target, ".claude/settings.json"), "utf8"));
  assert.deepEqual(settings.hooks.PreToolUse, [userHook, upgraded]);
  assert.deepEqual(settings.enabledPlugins, { custom: true });
});

test("customized managed hooks cause a visible conflict and are preserved", async (t) => {
  const options = await setup(t);
  await adopt({ ...options, apply: true });
  const customized = json({ hooks: { PreToolUse: [{ ...ownHook, matcher: "Edit" }] } });
  await write(options.target, ".claude/settings.json", customized);
  const result = await adopt({ ...options, apply: true });
  assert.ok(result.conflicts.some((entry) => entry.path === ".claude/settings.json"));
  assert.equal(await fs.readFile(path.join(options.target, ".claude/settings.json"), "utf8"), customized);
});

test("a complete exact manual hook upgrade is recognized without weakening wiring checks", async (t) => {
  const options = await setup(t);
  await adopt({ ...options, apply: true });
  const upgraded = { matcher: "Bash|PowerShell", hooks: ownHook.hooks };
  await write(options.templates, "dot-claude/settings.json", json({ hooks: { PreToolUse: [upgraded] } }));
  await write(options.target, ".claude/settings.json", json({ permissions: { allow: ["Read"] }, hooks: { PreToolUse: [userHook, upgraded] } }));
  const result = await adopt({ ...options, apply: true });
  assert.equal(result.ok, true, JSON.stringify(result));
  const settings = JSON.parse(await fs.readFile(path.join(options.target, ".claude/settings.json"), "utf8"));
  assert.deepEqual(settings.hooks.PreToolUse, [userHook, upgraded]);
  assert.deepEqual(settings.permissions, { allow: ["Read"] });
  assert.deepEqual((await adopt({ ...options, apply: true })).changes, []);
});

test("malformed settings are preserved and reported, not silently replaced", async (t) => {
  const options = await setup(t);
  await write(options.target, ".claude/settings.json", "{broken");
  const report = await adopt({ ...options, apply: true });
  assert.equal(report.ok, false);
  assert.ok(report.conflicts.some((entry) => entry.path === ".claude/settings.json"));
  assert.equal(await fs.readFile(path.join(options.target, ".claude/settings.json"), "utf8"), "{broken");
});

test("upgrades change unmodified installed files, preserve modified files and recreate missing files", async (t) => {
  const options = await setup(t);
  await adopt({ ...options, apply: true });
  await write(options.templates, "AGENTS.md", "# Upgraded rules\n");
  await write(options.templates, "ROLES.md", "# Upgraded roles\n");
  await write(options.target, "ROLES.md", "# My custom roles\n");
  await fs.unlink(path.join(options.target, "WORKFLOW.md"));
  const report = await adopt({ ...options, apply: true });
  assert.deepEqual(report.conflicts.map((entry) => entry.path), ["ROLES.md"]);
  assert.equal(await fs.readFile(path.join(options.target, "AGENTS.md"), "utf8"), "# Upgraded rules\n");
  assert.equal(await fs.readFile(path.join(options.target, "ROLES.md"), "utf8"), "# My custom roles\n");
  await fs.access(path.join(options.target, "WORKFLOW.md"));
});

test("default CI fails; doctor stays incomplete until commands and owners are configured", async (t) => {
  const options = await setup(t);
  await adopt({ ...options, apply: true });
  assert.match(await fs.readFile(path.join(options.target, ".github/workflows/ci.yml"), "utf8"), /exit 1/);
  const before = await adopt({ ...options, doctor: true });
  assert.equal(before.ok, false);
  assert.equal(before.incomplete.length, 2);
  const configured = await adopt({ ...options, apply: true, verifyCommand: "npm ci\nnpm test", owner: "@org/team" });
  assert.equal(configured.ok, true);
  const ci = await fs.readFile(path.join(options.target, ".github/workflows/ci.yml"), "utf8");
  assert.match(ci, /          npm ci\n          npm test/);
  assert.doesNotMatch(ci, /exit 1/);
  assert.equal(await fs.readFile(path.join(options.target, ".github/CODEOWNERS"), "utf8"), "* @org/team\n");
  assert.equal((await adopt({ ...options, doctor: true })).ok, true);
});

test("symlinked output parents and files fail preflight before any writes", async (t) => {
  for (const location of [".github", "AGENTS.md", ".sdlc"]) {
    const options = await setup(t);
    const outside = path.join(options.root, "outside");
    await fs.mkdir(options.target);
    await fs.mkdir(outside);
    const linkTarget = location === "AGENTS.md" ? path.join(outside, "rules.md") : outside;
    if (location === "AGENTS.md") await fs.writeFile(linkTarget, "outside rules\n");
    await fs.symlink(linkTarget, path.join(options.target, location));
    await assert.rejects(adopt({ ...options, apply: true }), /Refusing symlink/);
    assert.deepEqual(await fs.readdir(options.target), [location]);
    if (location === "AGENTS.md") assert.equal(await fs.readFile(linkTarget, "utf8"), "outside rules\n");
  }
});

test("symlinked target or ancestor is rejected, including an absent descendant", async (t) => {
  const options = await setup(t);
  const outside = path.join(options.root, "outside");
  await fs.mkdir(outside);
  await fs.symlink(outside, options.target);
  await assert.rejects(adopt({ ...options, apply: true }), /Refusing symlink/);
  await assert.rejects(adopt({ ...options, target: path.join(options.target, "new"), apply: true }), /Refusing symlink/);
  assert.deepEqual(await fs.readdir(outside), []);
});

test("manifest traversal is rejected before any writes", async (t) => {
  const options = await setup(t);
  const manifest = { schemaVersion: 1, version: "0.2.0", harnesses: ["pi"], configuration: {}, files: { "../outside": { sha256: "a".repeat(64) } } };
  await write(options.target, ".sdlc/installation.json", json(manifest));
  await assert.rejects(adopt({ ...options, apply: true }), /Unsafe installation path/);
  assert.deepEqual(await fs.readdir(options.target), [".sdlc"]);
});

test("malformed manifests and invalid configuration fail without mutating targets", async (t) => {
  const options = await setup(t);
  for (const bad of [{ owner: "@OWNER" }, { owner: "@someone\n* @attacker" }, { verifyCommand: "echo ${{ secrets.TOKEN }}" }, { verifyCommand: "" }, { harnesses: ["unknown"] }, { apply: true, doctor: true }]) {
    await assert.rejects(adopt({ ...options, apply: true, ...bad }));
  }
  await assert.rejects(fs.stat(options.target), { code: "ENOENT" });
  await write(options.target, ".sdlc/installation.json", "{}");
  await assert.rejects(adopt({ ...options, apply: true }), /Invalid installation manifest/);
  assert.deepEqual(await fs.readdir(options.target), [".sdlc"]);
});

test("doctor CLI exits nonzero for an unadopted project and does not create it", async (t) => {
  const options = await setup(t);
  const result = spawnSync(process.execPath, ["skills/adopt/scripts/adopt.mjs", "--target", options.target, "--doctor"], { encoding: "utf8" });
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).mode, "doctor");
  await assert.rejects(fs.stat(options.target), { code: "ENOENT" });
});

test("the shipped payload adopts cleanly, reruns unchanged, and resolves installed hook imports", async (t) => {
  const { target } = await setup(t);
  const options = { target, owner: "@sfc-owner", verifyCommand: "npm test", apply: true };
  const report = await adopt(options);
  assert.equal(report.ok, true, JSON.stringify(report));
  assert.equal((await adopt({ target, doctor: true })).ok, true);
  assert.deepEqual((await adopt(options)).changes, []);
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("SDLC_")) delete env[key];
  const payload = JSON.stringify({ tool_name: "Bash", tool_input: { command: "git push origin main" } });
  for (const hook of [".claude/hooks/guard-push.mjs", "scripts/sdlc/hooks.mjs"]) {
    const result = spawnSync(process.execPath, [path.join(target, hook)], { cwd: target, input: payload, encoding: "utf8", env });
    assert.equal(result.status, 2, `${hook}: ${result.stderr}`);
    assert.doesNotMatch(result.stderr, /ERR_MODULE_NOT_FOUND/);
  }
  for (const native of [".codex/hooks.json", ".pi/extensions/sdlc.ts", ".opencode/plugins/sdlc.js", "scripts/sdlc/controller.mjs"]) await fs.access(path.join(target, native));
});

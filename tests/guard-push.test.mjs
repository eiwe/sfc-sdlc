import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { targetsProtectedBranch } from "../skills/adopt/templates/dot-claude/hooks/guard-push.mjs";

const HOOK = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "skills/adopt/templates/dot-claude/hooks/guard-push.mjs",
);
const BRANCHES = ["main", "master"];

function cleanEnv(extra = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("SDLC_")) delete env[key];
  return { ...env, ...extra };
}

function run(command, env = {}) {
  const payload = { tool_name: "Bash", tool_input: { command } };
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    env: cleanEnv(env),
    encoding: "utf8",
  });
}

test("targetsProtectedBranch flags an explicit push to a protected branch", () => {
  assert.equal(targetsProtectedBranch("git push origin main", BRANCHES), true);
  assert.equal(targetsProtectedBranch("git push origin HEAD:main", BRANCHES), true);
  assert.equal(targetsProtectedBranch("git push origin master", BRANCHES), true);
});

test("targetsProtectedBranch ignores substrings and other branches", () => {
  assert.equal(targetsProtectedBranch("git push origin feature/main-thing", BRANCHES), false);
  assert.equal(targetsProtectedBranch("git push origin main-branch", BRANCHES), false);
  assert.equal(targetsProtectedBranch("git status", BRANCHES), false);
});

test("e2e: push to main is blocked and names the override", () => {
  const result = run("git push origin main");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SDLC_ALLOW_PUSH_MAIN/);
});

test("e2e: push to a feature branch is allowed", () => {
  const result = run("git push origin feature/main-thing");
  assert.equal(result.status, 0);
});

test("e2e: SDLC_ALLOW_PUSH_MAIN=1 allows the push", () => {
  const result = run("git push origin main", { SDLC_ALLOW_PUSH_MAIN: "1" });
  assert.equal(result.status, 0);
});

test("e2e: malformed stdin fails open", () => {
  const result = spawnSync(process.execPath, [HOOK], {
    input: "not json{",
    env: cleanEnv(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
});

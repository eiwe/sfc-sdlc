import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { isProtectedTestPath } from "../skills/adopt/templates/dot-claude/hooks/guard-tests.mjs";

const HOOK = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "skills/adopt/templates/dot-claude/hooks/guard-tests.mjs",
);

function cleanEnv(extra = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("SDLC_")) delete env[key];
  return { ...env, ...extra };
}

function run(filePath, env = {}, toolName = "Edit") {
  const payload = { tool_name: toolName, tool_input: { file_path: filePath } };
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    env: cleanEnv(env),
    encoding: "utf8",
  });
}

test("isProtectedTestPath matches common test conventions", () => {
  assert.ok(isProtectedTestPath("tests/foo.test.mjs"));
  assert.ok(isProtectedTestPath("src/test_x.py"));
  assert.ok(isProtectedTestPath("pkg/thing_test.go"));
  assert.ok(isProtectedTestPath("app/__tests__/a.js"));
  assert.ok(isProtectedTestPath("src/main/FooTests.java"));
});

test("isProtectedTestPath ignores non-test source files", () => {
  assert.equal(isProtectedTestPath("src/foo.mjs"), false);
  assert.equal(isProtectedTestPath("notekeep/store.py"), false);
  assert.equal(isProtectedTestPath(""), false);
});

test("e2e: guard is inactive without SDLC_PROTECT_TESTS", () => {
  const result = run("tests/foo.test.mjs");
  assert.equal(result.status, 0);
});

test("e2e: active guard blocks a JS test file and names the override", () => {
  const result = run("tests/foo.test.mjs", { SDLC_PROTECT_TESTS: "1" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SDLC_ALLOW_TEST_EDIT/);
});

test("e2e: active guard blocks a Python test file", () => {
  const result = run("src/test_x.py", { SDLC_PROTECT_TESTS: "1" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SDLC_ALLOW_TEST_EDIT/);
});

test("e2e: active guard allows a non-test source file", () => {
  const result = run("src/foo.mjs", { SDLC_PROTECT_TESTS: "1" });
  assert.equal(result.status, 0);
});

test("e2e: SDLC_ALLOW_TEST_EDIT=1 allows the test edit", () => {
  const result = run("tests/foo.test.mjs", {
    SDLC_PROTECT_TESTS: "1",
    SDLC_ALLOW_TEST_EDIT: "1",
  });
  assert.equal(result.status, 0);
});

test("e2e: malformed stdin blocks visibly instead of silently bypassing protection", () => {
  const result = spawnSync(process.execPath, [HOOK], {
    input: "not json{",
    env: cleanEnv({ SDLC_PROTECT_TESTS: "1" }),
    encoding: "utf8",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /payload error/);
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { isProductionCommand } from "../skills/adopt/templates/dot-claude/hooks/guard-production.mjs";

const HOOK = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "skills/adopt/templates/dot-claude/hooks/guard-production.mjs",
);

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

test("isProductionCommand catches context-sensitive writes and explicit production operations", () => {
  assert.ok(isProductionCommand("helm upgrade app --namespace production"));
  assert.ok(isProductionCommand("kubectl apply -f prod.yaml on prod"));
  assert.equal(isProductionCommand("make deploy to staging"), null);
  assert.equal(isProductionCommand("echo production"), null);
  assert.equal(isProductionCommand("git apply patch.diff"), null);
  assert.ok(isProductionCommand("terraform apply"));
  assert.ok(isProductionCommand("kubectl apply -f deploy.yaml"));
});

test("isProductionCommand honors a custom pattern source", () => {
  assert.ok(isProductionCommand("./ship.sh", "ship\\.sh"));
  assert.equal(isProductionCommand("helm upgrade app --namespace production", "ship\\.sh"), null);
});

test("e2e: production command is blocked without approval and names the override", () => {
  const result = run("kubectl apply -f deploy.yaml --context production");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SDLC_RELEASE_APPROVAL/);
});

test("e2e: exact expiring SDLC_RELEASE_APPROVAL acknowledges only its operation", () => {
  const result = run("kubectl apply -f deploy.yaml --context production", {
    SDLC_RELEASE_APPROVAL: JSON.stringify({ command: "kubectl apply -f deploy.yaml --context production", cwd: process.cwd(), expires: new Date(Date.now() + 60000).toISOString(), reference: "CHG-4821" }),
  });
  assert.equal(result.status, 0);
});

test("e2e: a non-production command is allowed", () => {
  const result = run("make deploy to staging");
  assert.equal(result.status, 0);
});

test("e2e: SDLC_PRODUCTION_PATTERN overrides detection", () => {
  const blocked = run("./ship.sh", { SDLC_PRODUCTION_PATTERN: "ship\\.sh" });
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /SDLC_RELEASE_APPROVAL/);

  const allowed = run("helm upgrade app --namespace production", {
    SDLC_PRODUCTION_PATTERN: "ship\\.sh",
  });
  assert.equal(allowed.status, 0);
});

test("e2e: malformed stdin blocks visibly instead of silently bypassing protection", () => {
  const result = spawnSync(process.execPath, [HOOK], {
    input: "not json{",
    env: cleanEnv(),
    encoding: "utf8",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /payload error/);
});

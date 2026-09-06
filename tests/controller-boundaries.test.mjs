import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runWorkflow } from "../skills/adopt/templates/scripts/sdlc/controller.mjs";

const controllerURL = new URL("../skills/adopt/templates/scripts/sdlc/controller.mjs", import.meta.url).href;
const worker = fileURLToPath(new URL("./fixtures/boundary-worker.mjs", import.meta.url));

function fixture(t, scenario = "happy", integration = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sfc-boundary-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo"); fs.mkdirSync(repo);
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();
  git("init", "-q"); git("config", "user.name", "Boundary fixture"); git("config", "user.email", "fixture@example.invalid");
  fs.mkdirSync(path.join(repo, "src"));
  fs.writeFileSync(path.join(repo, "src/result.txt"), "wrong\n");
  fs.writeFileSync(path.join(repo, "src/shared-spec.md"), "# Accepted design\n");
  fs.writeFileSync(path.join(repo, ".gitattributes"), "src/result.txt filter=sdlc\n");
  git("add", "."); git("commit", "-qm", "initial");
  const driverMarker = path.join(root, "driver-ran.txt");
  const driver = path.join(root, "driver.mjs");
  fs.writeFileSync(driver, `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(driverMarker)}, 'executed'); process.stdin.pipe(process.stdout);`);
  const command = [process.execPath, worker, scenario, driver];
  const integrationMarker = path.join(root, "integrations.txt");
  const policy = {
    version: 1, mode: "cooperative",
    runners: Object.fromEntries(["planner", "implementer", "verifier", "reviewer"].map((role) => [role, command])),
    verify: [process.execPath, "-e", "if(require('node:fs').readFileSync('src/result.txt','utf8').trim()!=='42')process.exit(1)"],
    allowedPaths: ["docs/", "src/", "HANDOFF.md", "CHANGELOG.md"], protectedPaths: [],
    maxAttempts: 2, timeoutMs: 3000, maxElapsedMs: 30000,
    ...(integration ? { allowIntegration: true, integrate: [process.execPath, "-e", `require('node:fs').appendFileSync(${JSON.stringify(integrationMarker)}, 'integrated'+String.fromCharCode(10))`] } : {}),
  };
  const policyFile = path.join(root, "policy.json"), stateFile = path.join(root, "run.json");
  fs.writeFileSync(policyFile, JSON.stringify(policy));
  return { root, repo, git, driverMarker, integrationMarker, options: { repo, change: "audit", policyFile, stateFile, task: "Return 42 with exact revision proof." } };
}

for (const scenario of ["assume-unchanged", "skip-worktree"]) {
  test(`hidden ${scenario} writes cannot earn verification for a different committed tree`, async (t) => {
    const f = fixture(t, scenario);
    const state = await runWorkflow(f.options);
    assert.equal(state.status, "escalated");
    assert.match(state.reason, /Hidden index entries/);
    assert.equal(f.git("show", "HEAD:src/result.txt"), "wrong");
    assert.equal(fs.readFileSync(path.join(f.repo, "src/result.txt"), "utf8"), "42\n");
    assert.ok(!state.history.some((entry) => entry.stage === "verification"));
  });
}

test("symlink planning artifacts cannot stand in for the actual reviewed content", async (t) => {
  const state = await runWorkflow(fixture(t, "symlink-artifact").options);
  assert.equal(state.status, "escalated");
  assert.match(state.reason, /regular committed file/);
});

test("approved artifact digests include trailing whitespace bytes", async (t) => {
  const state = await runWorkflow(fixture(t, "trailing-whitespace").options);
  assert.equal(state.status, "escalated");
  assert.match(state.reason, /Approved artifact changed: plan.md/);
});

for (const scenario of ["filter.sdlc.clean", "diff.external"]) {
  test(`worker-defined ${scenario} is rejected before Git executes it`, async (t) => {
    const f = fixture(t, scenario);
    const state = await runWorkflow(f.options);
    assert.equal(state.status, "escalated");
    assert.match(state.reason, /Executable Git filters\/diff drivers/);
    assert.equal(fs.existsSync(f.driverMarker), false);
  });
}

for (const checkpoint of ["before-integration", "after-effect-before-receipt", "after-terminal-receipt"]) {
  test(`process death ${checkpoint} never repeats integration`, async (t) => {
    const f = fixture(t, "happy", true);
    const wrapper = path.join(f.root, "crash-controller.mjs");
    fs.writeFileSync(wrapper, `
      import fs from 'node:fs';
      import {runWorkflow} from ${JSON.stringify(controllerURL)};
      const options = ${JSON.stringify(f.options)};
      const checkpoint = ${JSON.stringify(checkpoint)};
      const rename = fs.renameSync;
      fs.renameSync = (from, to) => {
        if (to !== options.stateFile) return rename(from, to);
        const next = JSON.parse(fs.readFileSync(from, 'utf8'));
        if (checkpoint === 'after-effect-before-receipt' && next.status === 'complete') process.exit(73);
        rename(from, to);
        if (checkpoint === 'before-integration' && next.stage === 'integration' && !next.pending && !next.history.some(x => x.stage === 'integration')) process.exit(73);
        if (checkpoint === 'after-terminal-receipt' && next.status === 'complete') process.exit(73);
      };
      await runWorkflow(options);
    `);
    const child = spawnSync(process.execPath, [wrapper], { encoding: "utf8", timeout: 30000 });
    assert.equal(child.status, 73, child.stderr);
    const saved = JSON.parse(fs.readFileSync(f.options.stateFile, "utf8"));
    // The child is confirmed exited. Reconcile its stale controller lock only.
    fs.unlinkSync(`${f.options.stateFile}.lock`);
    const resumed = await runWorkflow(f.options);
    if (checkpoint === "after-effect-before-receipt") {
      assert.equal(saved.pending.stage, "integration");
      assert.equal(resumed.status, "escalated");
      assert.match(resumed.reason, /indeterminate/);
    } else assert.equal(resumed.status, "complete", resumed.reason);
    assert.equal(fs.readFileSync(f.integrationMarker, "utf8"), "integrated\n");
    const repeated = await runWorkflow(f.options);
    assert.equal(repeated.status, resumed.status);
    assert.equal(fs.readFileSync(f.integrationMarker, "utf8"), "integrated\n");
  });
}

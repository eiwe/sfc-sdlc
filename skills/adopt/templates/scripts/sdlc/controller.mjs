#!/usr/bin/env node
// Run from an operator-controlled installation for authoritative enforcement.
// A separate path is not a sandbox: the host must isolate ALL worker processes,
// including tests, from policy/state/controller and integration credentials.
import { spawn, execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STEPS = {
  intent: { role: "planner", artifact: "intent.md", next: "intent-review" },
  "intent-review": { role: "reviewer", source: "intent", next: "design" },
  design: { role: "planner", artifact: "spec.md", next: "design-review" },
  "design-review": { role: "reviewer", source: "design", next: "plan" },
  plan: { role: "planner", artifact: "plan.md", next: "plan-review" },
  "plan-review": { role: "reviewer", source: "plan", next: "build" },
  regression: { role: "implementer", next: "regression-review" },
  "regression-review": { role: "reviewer", source: "regression", next: "build" },
  build: { role: "implementer", next: "verification" },
  verification: { role: "verifier", source: "build", next: "review" },
  review: { role: "reviewer", source: "build", next: "ready" },
};
const TERMINAL = new Set(["ready", "complete", "escalated"]);
const hash = (text) => createHash("sha256").update(text).digest("hex");
const now = () => new Date().toISOString();
const inside = (root, target) => target === root || target.startsWith(root + path.sep);
const git = (repo, ...args) => {
  const options = {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 8 * 1024 * 1024, timeout: 10000,
    env: { ...childEnv(), GIT_OPTIONAL_LOCKS: "0", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null", GIT_NO_REPLACE_OBJECTS: "1" },
  };
  const prefix = ["-c", "core.fsmonitor=false", "-c", "core.ignoreStat=false", "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", "-c", "gc.auto=0", "-c", "maintenance.auto=false", "-C", repo];
  // Reading configuration does not execute its filter/diff commands. Reject
  // them before operations on worker-controlled paths can invoke those commands.
  const config = execFileSync("git", [...prefix, "config", "--null", "--list"], options);
  if (config.split("\0").some((entry) => /^(?:filter\..+\.(?:clean|smudge|process)|diff\.(?:external|.+\.(?:command|textconv)))\n/i.test(entry))) {
    throw new Error("Executable Git filters/diff drivers are not supported in controller checkouts");
  }
  return execFileSync("git", [...prefix, ...args], options);
};
const revision = (repo) => git(repo, "rev-parse", "HEAD").trim();
const clean = (repo) => {
  const hidden = git(repo, "ls-files", "-v", "-z").split("\0").filter(Boolean).some((entry) => /^[a-zS]/.test(entry));
  if (hidden) throw new Error("Hidden index entries (assume-unchanged/skip-worktree) invalidate revision evidence");
  return git(repo, "status", "--porcelain=v1", "--untracked-files=all") === "";
};
const pathsAt = (repo, rev) => git(repo, "ls-tree", "-rz", "--name-only", rev).split("\0").filter(Boolean);
const changed = (repo, a, b) => git(repo, "diff", "--name-only", "-z", "--no-renames", a, b).split("\0").filter(Boolean);
const workingChanges = (repo) => [...new Set([
  ...git(repo, "diff", "--name-only", "-z", "--no-renames", "HEAD").split("\0"),
  ...git(repo, "ls-files", "--others", "--exclude-standard", "-z").split("\0"),
].filter(Boolean))];
const matches = (file, prefixes) => prefixes.some((p) => p === "." || file === p || (p.endsWith("/") && file.startsWith(p)));

function argv(value, name) {
  if (!Array.isArray(value) || !value.length || value.some((v) => typeof v !== "string" || !v || v.includes("\0"))) {
    throw new Error(`${name} must be a nonempty argv array`);
  }
}

export function validatePolicy(policy) {
  if (policy.version !== 1 || !["cooperative", "isolated"].includes(policy.mode)) {
    throw new Error("policy requires version:1 and mode:cooperative|isolated (host must enforce isolation)");
  }
  for (const role of ["planner", "implementer", "verifier", "reviewer"]) argv(policy.runners?.[role], `runners.${role}`);
  argv(policy.verify, "verify");
  if (policy.integrate) {
    argv(policy.integrate, "integrate");
    if (policy.allowIntegration !== true) throw new Error("integrate requires explicit allowIntegration:true");
  }
  for (const key of ["allowedPaths", "protectedPaths", "testPaths"]) {
    const values = policy[key] ?? (key === "allowedPaths" ? [] : []);
    if (!Array.isArray(values) || values.some((v) => typeof v !== "string" || !v || v.startsWith("/") || v.includes("\\") || v.split("/").includes("..") || /[*?\[\]\0]/.test(v))) {
      throw new Error(`${key} must contain repository-relative literal paths or directory prefixes ending /`);
    }
    if (key === "allowedPaths" && values.length === 0) throw new Error("allowedPaths must explicitly bound the task (use '.' for the whole repo)");
  }
  if (policy.taskKind && !["change", "fix"].includes(policy.taskKind)) throw new Error("taskKind must be change or fix");
  if (policy.taskKind === "fix" && !policy.testPaths?.length) throw new Error("fix requires testPaths for the regression baseline");
  for (const key of ["maxAttempts", "maxInvocations", "timeoutMs", "maxElapsedMs", "maxOutputBytes"]) {
    if (policy[key] !== undefined && (!Number.isSafeInteger(policy[key]) || policy[key] <= 0)) throw new Error(`${key} must be a positive integer`);
  }
  for (const key of ["passEnv", "verifyEnv", "integrationEnv"]) {
    if (policy[key] !== undefined && (!Array.isArray(policy[key]) || policy[key].some((v) => typeof v !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(v)))) throw new Error(`${key} must contain environment variable names`);
  }
  return policy;
}

function safeExternal(filename, repo) {
  const absolute = path.resolve(filename);
  let parent = absolute;
  while (!fs.existsSync(parent)) {
    const next = path.dirname(parent);
    if (next === parent) throw new Error(`Cannot resolve ${filename}`);
    parent = next;
  }
  const canonical = path.join(fs.realpathSync(parent), path.relative(parent, absolute));
  if (inside(repo, canonical)) throw new Error("policy and state must be outside the worker checkout; host isolation is still required");
  if (fs.existsSync(absolute) && fs.lstatSync(absolute).isSymbolicLink()) throw new Error("policy/state symlinks are not supported");
  return canonical;
}

function save(filename, state) {
  const temp = `${filename}.${randomUUID()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(state, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  fs.renameSync(temp, filename);
}

function childEnv(names = []) {
  const env = {};
  for (const name of ["PATH", "HOME", "USER", "LOGNAME", "TMPDIR", "TEMP", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT", "LANG", ...names]) {
    if (process.env[name] !== undefined) env[name] = process.env[name];
  }
  env.GIT_TERMINAL_PROMPT = "0";
  return env;
}

export async function execute(command, { repo, input, timeoutMs, maxOutputBytes, env = [] }) {
  return new Promise((resolve) => {
    let stdout = "", stderr = "", bytes = 0, fault = null, timer, finished = false;
    const child = spawn(command[0], command.slice(1), {
      cwd: repo, env: childEnv(env), stdio: ["pipe", "pipe", "pipe"],
      detached: process.platform !== "win32", windowsHide: true,
    });
    const stop = () => {
      try { if (process.platform !== "win32" && child.pid) process.kill(-child.pid, "SIGKILL"); else child.kill("SIGKILL"); } catch { /* already exited */ }
    };
    const finish = (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      stop(); // don't leave grandchildren running after the runner exits
      resolve({ code, signal, stdout, stderr, error: fault });
    };
    const collect = (key, data) => {
      bytes += data.length;
      if (bytes > maxOutputBytes) { fault = "output limit exceeded"; stop(); return; }
      if (key === "stdout") stdout += data.toString(); else stderr += data.toString();
    };
    child.stdout.on("data", (data) => collect("stdout", data));
    child.stderr.on("data", (data) => collect("stderr", data));
    child.on("error", (error) => { fault = error.message; finish(null, null); });
    child.on("close", finish);
    child.stdin.on("error", () => {});
    timer = setTimeout(() => { fault = "timeout"; stop(); }, timeoutMs);
    child.stdin.end(input ? JSON.stringify(input) : "");
  });
}

function artifactHashes(repo, change) {
  const result = {};
  for (const name of ["intent.md", "spec.md", "plan.md"]) {
    const filename = `docs/changes/${change}/${name}`;
    const entry = git(repo, "ls-tree", "HEAD", "--", filename);
    if (!entry) continue;
    if (!/^100(?:644|755) blob /.test(entry)) throw new Error(`Artifact must be a regular committed file: ${name}`);
    result[name] = hash(git(repo, "show", `HEAD:${filename}`));
  }
  return result;
}

// A CLI is deliberately the only authoritative entry point: no worker-supplied
// `approve --role` endpoint. The controller owns invocations and their receipts.
export async function runWorkflow({ repo, change, policyFile, stateFile, task }) {
  repo = fs.realpathSync(repo);
  if (fs.realpathSync(git(repo, "rev-parse", "--show-toplevel").trim()) !== repo) throw new Error("repo must be the Git worktree root");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(change)) throw new Error("change must be a kebab-case slug");
  policyFile = safeExternal(policyFile, repo);
  stateFile = safeExternal(stateFile, repo);
  if (policyFile === stateFile) throw new Error("policy and state paths must differ");
  const policyText = fs.readFileSync(policyFile, "utf8");
  const policyDigest = hash(policyText);
  const policy = validatePolicy(JSON.parse(policyText));
  const limits = { maxAttempts: 3, maxInvocations: 40, timeoutMs: 120000, maxElapsedMs: 1800000, maxOutputBytes: 1024 * 1024, ...policy };
  fs.mkdirSync(path.dirname(stateFile), { recursive: true, mode: 0o700 });
  const lockPath = `${stateFile}.lock`;
  let lock;
  try { lock = fs.openSync(lockPath, "wx", 0o600); }
  catch { throw new Error(`Run is locked: ${lockPath}. Check for a live controller before removing a stale lock.`); }
  fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, startedAt: now() }));
  let state;
  try {
    state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : {
      version: 1, id: randomUUID(), repo, change, task, mode: policy.mode, policyDigest,
      base: revision(repo), expectedRevision: revision(repo), stage: "intent", status: "running",
      startedAt: now(), attempts: {}, invocations: 0, history: [], approvals: {}, frozen: {}, pending: null,
    };
    if (state.version !== 1 || state.repo !== repo || state.change !== change || state.policyDigest !== policyDigest || (task && state.task !== task)) throw new Error("Run identity, task, or policy changed; start a new reviewed run");
    if (typeof state.task !== "string" || !state.task.trim()) throw new Error("task is required for a new run");
    if (!STEPS[state.stage] && !TERMINAL.has(state.stage) && state.stage !== "integration") throw new Error("Invalid workflow state");
    const persist = () => save(stateFile, state);
    const escalate = (reason) => {
      state.status = "escalated"; state.reason = reason; state.finishedAt = now(); state.pending = null; persist(); return state;
    };
    const remaining = () => limits.maxElapsedMs - (Date.now() - Date.parse(state.startedAt));
    const checkTree = () => {
      if (!clean(repo)) throw new Error("Worker checkout is dirty; commit the submitted revision before advancing");
      for (const filename of changed(repo, state.base, revision(repo))) {
        if (!matches(filename, policy.allowedPaths)) throw new Error(`Out-of-scope change: ${filename}`);
        if (matches(filename, policy.protectedPaths ?? [])) throw new Error(`Protected change requires escalation: ${filename}`);
      }
      const current = artifactHashes(repo, change);
      for (const [name, digest] of Object.entries(state.frozen)) {
        if (current[name] !== digest) throw new Error(`Approved artifact changed: ${name}; start a new design review`);
      }
      if (state.regression) {
        for (const filename of state.regression.paths) {
          if (git(repo, "diff", "--name-only", state.regression.revision, "HEAD", "--", filename)) throw new Error(`Regression baseline changed: ${filename}`);
        }
      }
    };
    if (state.pending?.stage === "integration") return escalate("Integration was interrupted; its external result is indeterminate. Reconcile it before any new run.");
    if (state.pending) return escalate(`Interrupted ${state.pending.stage} invocation; reconcile worker changes and start a new run`);
    if (revision(repo) !== state.expectedRevision || !clean(repo)) return escalate("Submitted revision changed since the last checkpoint; existing evidence is stale");
    if (TERMINAL.has(state.status)) return state;
    checkTree();
    persist();
    const invoke = async (role, stage, command, input, env) => {
      if (remaining() <= 0 || state.invocations >= limits.maxInvocations) throw new Error("Run elapsed-time or invocation budget exhausted");
      const runId = randomUUID();
      state.invocations += 1;
      state.pending = { runId, role, stage, revision: revision(repo), startedAt: now() };
      persist();
      const result = await execute(command, {
        repo, input: input ? { ...input, runId } : undefined,
        timeoutMs: Math.min(limits.timeoutMs, remaining()), maxOutputBytes: limits.maxOutputBytes, env,
      });
      if (hash(fs.readFileSync(policyFile, "utf8")) !== policyDigest) throw new Error("Trusted policy changed during execution");
      const record = { ...state.pending, finishedAt: now(), ...result };
      state.history.push(record);
      // Integration receipt and terminal status must be one checkpoint. Until
      // then durable state remains pending: crashes require reconciliation,
      // never an automatic repeat of a potentially completed external action.
      if (stage !== "integration") { state.pending = null; persist(); }
      return record;
    };
    while (state.status === "running") {
      const stage = state.stage;
      if (stage === "integration") {
        const submitted = revision(repo);
        checkTree();
        if (!policy.integrate || state.approvals.verification?.revision !== submitted || state.approvals.review?.revision !== submitted) return escalate("Integration lacks configured authority or current independent evidence");
        const integrated = await invoke("integration", "integration", policy.integrate, {
          version: 1, workflowId: state.id, repo, change, revision: submitted, approvals: state.approvals,
        }, policy.integrationEnv);
        if (integrated.code !== 0 || integrated.error) return escalate("Integration failed or timed out; reconcile external state before retrying");
        state.status = "complete"; state.stage = "complete"; state.pending = null; state.finishedAt = now(); state.expectedRevision = revision(repo); persist();
        continue;
      }
      const step = STEPS[stage];
      if (!step) throw new Error(`No executable stage ${stage}`);
      state.attempts[stage] = (state.attempts[stage] ?? 0) + 1;
      if (state.attempts[stage] > limits.maxAttempts) return escalate(`Revision budget exhausted at ${stage}`);
      const before = revision(repo);
      const artifacts = artifactHashes(repo, change);
      let verification;
      if (stage === "verification") {
        verification = await invoke("toolchain", "check", policy.verify, undefined, policy.verifyEnv);
        if (revision(repo) !== before || !clean(repo)) return escalate("Verification command mutated the submitted revision");
        if (verification.error || verification.code === null || verification.signal) return escalate(`Verification unavailable: ${verification.error ?? verification.signal}`);
        if (verification.code !== 0) {
          state.feedback = verification; state.stage = "build"; state.approvals = {}; persist(); continue;
        }
      }
      const request = {
        version: 1, role: step.role, stage, task: state.task, repo, change,
        revision: before, artifacts, feedback: state.feedback ?? null,
        persona: policy.personas?.[step.role] ?? "", verification,
      };
      const result = await invoke(step.role, stage, policy.runners[step.role], request, policy.passEnv);
      if (result.error || result.code !== 0) return escalate(`Runner failed at ${stage}: ${result.error ?? result.stderr ?? result.code}`);
      let verdict;
      try { verdict = JSON.parse(result.stdout); }
      catch { return escalate(`Invalid JSON result at ${stage}`); }
      if (!["advance", "revise", "escalate"].includes(verdict?.decision) || typeof verdict.summary !== "string" || !verdict.summary.trim()) return escalate(`Invalid decision/summary at ${stage}`);
      let after = revision(repo);
      if (step.source && (after !== before || !clean(repo))) return escalate(`Independent ${stage} modified its submission`);
      if (after !== before) return escalate(`Worker changed Git history at ${stage}; only the controller commits stage output`);
      if (verdict.decision === "escalate") return escalate(`${stage}: ${verdict.summary}`);
      if (!step.source) {
        const files = workingChanges(repo);
        for (const filename of files) {
          if (!matches(filename, policy.allowedPaths)) return escalate(`Out-of-scope change: ${filename}`);
          if (matches(filename, policy.protectedPaths ?? [])) return escalate(`Protected change requires escalation: ${filename}`);
        }
        if (step.artifact) {
          const allowed = [`docs/changes/${change}/${step.artifact}`, ...(stage === "design" ? ["docs/decisions/"] : [])];
          if (files.some((filename) => !matches(filename, allowed))) return escalate(`Planning stage ${stage} changed files outside its artifact boundary`);
        }
        if (files.length) {
          git(repo, "add", "--all", "--", ".");
          git(repo, "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", "-c", "user.name=SFC Controller", "-c", "user.email=sfc-controller@localhost", "commit", "-m", `sdlc: ${stage} ${change}`);
          after = revision(repo);
        }
      }
      checkTree();
      result.decision = verdict.decision; result.summary = verdict.summary;
      result.resultRevision = after; result.artifacts = artifactHashes(repo, change);
      if (verdict.decision === "revise") {
        state.feedback = { stage, summary: verdict.summary };
        state.stage = step.source ?? stage;
        if (state.stage === "regression") state.regression = null;
        state.expectedRevision = after; state.approvals = {}; persist(); continue;
      }
      if (step.artifact) {
        const content = git(repo, "show", `HEAD:docs/changes/${change}/${step.artifact}`);
        if (!content.trim()) return escalate(`Missing committed ${step.artifact}`);
      }
      if (["intent-review", "design-review", "plan-review"].includes(stage)) {
        const artifact = STEPS[step.source].artifact;
        state.frozen[artifact] = result.artifacts[artifact];
      }
      if (stage === "regression") {
        const additions = changed(repo, before, after);
        if (!additions.length || additions.some((p) => !matches(p, policy.testPaths))) return escalate("Regression stage must commit only test changes");
        const failure = await invoke("toolchain", "regression-check", policy.verify, undefined, policy.verifyEnv);
        if (revision(repo) !== after || !clean(repo)) return escalate("Regression check mutated its submission");
        if (failure.error || failure.signal || failure.code === null || failure.code === 0) return escalate("Regression must fail normally before implementation; missing/crashed checks are not proof");
        state.regression = { revision: after, paths: pathsAt(repo, after).filter((p) => matches(p, policy.testPaths)) };
        state.feedback = failure;
      } else if (stage !== "regression-review") state.feedback = null;
      if (stage === "verification") state.approvals.verification = { runId: result.runId, revision: after, checkRunId: verification.runId };
      if (stage === "review") {
        if (state.approvals.verification?.revision !== after || state.approvals.verification.runId === result.runId) return escalate("Missing independent verification of this revision");
        state.approvals.review = { runId: result.runId, revision: after };
        for (const filename of ["HANDOFF.md", "CHANGELOG.md"]) {
          if (!git(repo, "show", `HEAD:${filename}`).trim()) return escalate(`Missing committed handoff evidence: ${filename}`);
        }
      }
      state.expectedRevision = after;
      state.stage = stage === "plan-review" && policy.taskKind === "fix" ? "regression" : step.next;
      if (state.stage === "ready") {
        state.status = policy.integrate ? "running" : "ready";
        state.stage = policy.integrate ? "integration" : "ready";
        if (!policy.integrate) state.finishedAt = now();
      }
      persist();
    }
    return state;
  } catch (error) {
    if (!state) throw error;
    state.status = "escalated"; state.reason = error.message; state.finishedAt = now();
    save(stateFile, state);
    return state;
  } finally {
    fs.closeSync(lock);
    fs.unlinkSync(lockPath);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i].startsWith("--") || args[i + 1] === undefined) throw new Error("Expected --option value pairs");
    options[args[i].slice(2)] = args[i + 1];
  }
  if (command === "status" && options.state) {
    const state = JSON.parse(fs.readFileSync(options.state, "utf8"));
    console.log(JSON.stringify({ id: state.id, stage: state.stage, status: state.status, revision: state.expectedRevision, reason: state.reason, invocations: state.invocations }, null, 2));
    return;
  }
  if (command !== "run" || !options.repo || !options.change || !options.policy || !options.state) throw new Error("Usage: controller.mjs run --repo PATH --change SLUG --policy EXTERNAL.json --state EXTERNAL.json --task TEXT | status --state EXTERNAL.json");
  const state = await runWorkflow({ repo: options.repo, change: options.change, policyFile: options.policy, stateFile: options.state, task: options.task });
  console.log(JSON.stringify({ id: state.id, status: state.status, stage: state.stage, revision: state.expectedRevision, reason: state.reason, invocations: state.invocations, mode: state.mode }, null, 2));
  if (state.status === "escalated") process.exitCode = 2;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 2; });

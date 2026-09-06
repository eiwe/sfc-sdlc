/** Shared local preflight assistance. Shell recognition is heuristic: aliases,
 * scripts, indirect tools and credentials need external controls and controller
 * diff verification. Environment switches are cooperative overrides, never
 * authenticated workflow approval. */
import path from "node:path";

const TEST_PATTERN = [
  "(^|/)(test|tests|__tests__|spec|specs)/", "\\.(test|spec)\\.[cm]?[jt]sx?$",
  "(^|/)test_[^/]+\\.py$", "_test\\.(go|py|rb|rs|ex|exs)$", "Tests?\\.(java|kt|cs|swift|scala)$",
].join("|");
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function isProtectedTestPath(filePath, patternSource) {
  return typeof filePath === "string" && !!filePath &&
    new RegExp(patternSource || TEST_PATTERN).test(filePath.replace(/\\/g, "/"));
}

/** Includes deleted paths and both sides of a move, not just the first patch. */
export function patchPaths(patch) {
  if (typeof patch !== "string") throw new Error("Patch text is missing");
  const paths = [...patch.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)\r?$/gm)]
    .map((match) => match[1].trim());
  if (!patch.startsWith("*** Begin Patch") || !patch.trimEnd().endsWith("*** End Patch") || !paths.length)
    throw new Error("Unsupported or malformed patch payload");
  return [...new Set(paths)];
}

/** Unknown tools explicitly have unknown coverage. */
export function normalizeEvent(payload, harness = "auto") {
  if (!object(payload)) throw new Error("Expected a tool event object");
  const name = payload.tool_name ?? payload.toolName ?? payload.tool;
  const input = payload.tool_input ?? payload.toolInput ?? payload.input ?? payload.args ?? {};
  if (typeof name !== "string" || !object(input)) throw new Error("Tool name or input is malformed");
  const tool = name.toLowerCase();
  const cwd = payload.cwd ?? process.cwd();
  if (typeof cwd !== "string") throw new Error("Tool working directory is malformed");
  if (["bash", "powershell", "exec_command", "shell_command"].includes(tool)) {
    const command = input.command ?? input.cmd;
    if (typeof command !== "string") throw new Error("Shell command is missing");
    return { harness, operation: "shell", paths: [], command, cwd, coverage: "heuristic" };
  }
  if (tool === "apply_patch") return {
    harness, operation: "edit", paths: patchPaths(input.command ?? input.patchText ?? input.patch),
    command: "", cwd, coverage: "paths",
  };
  if (["edit", "write", "multiedit"].includes(tool)) {
    const file = input.file_path ?? input.filePath ?? input.path;
    if (typeof file !== "string" || !file) throw new Error("Edited file path is missing");
    return { harness, operation: "edit", paths: [file], command: "", cwd, coverage: "paths" };
  }
  return { harness, operation: "unknown", paths: [], command: "", cwd, coverage: "unknown" };
}

// A lexical aid, not a shell interpreter; dynamic expansion is outside coverage.
function segments(command) {
  const tokens = command.match(/"(?:\\.|[^"\\])*"|'[^']*'|&&|\|\||[;&|\n()]|[^\s;&|()]+/g) || [];
  const result = [[]];
  for (const token of tokens) {
    if (/^(?:&&|\|\||[;&|\n()])$/.test(token)) result.push([]);
    else result.at(-1).push(token.replace(/^(['"])(.*)\1$/, "$2"));
  }
  return result.filter((part) => part.length);
}

function commandIndex(tokens, executable) {
  let index = 0;
  while (index < tokens.length && (/^\w+=/.test(tokens[index]) || ["env", "sudo", "command", "&"].includes(tokens[index]))) index++;
  return new RegExp(`(?:^|[/\\\\])${executable}(?:\\.exe)?$`, "i").test(tokens[index] || "") ? index : -1;
}

function subcommands(tokens, index) {
  index++;
  while (tokens[index]?.startsWith("-")) {
    const option = tokens[index++];
    if (!option.includes("=") && !["--debug", "--logtostderr"].includes(option)) index++;
  }
  return tokens.slice(index);
}

/** Blocks protected destinations and unresolved default/all/wildcard pushes. */
export function targetsProtectedBranch(command, branches = ["main", "master"]) {
  if (!branches.length) throw new Error("Protected branch list must not be empty");
  return segments(command).some((tokens) => {
    let index = commandIndex(tokens, "git");
    if (index < 0) return false;
    index++;
    while (tokens[index]?.startsWith("-")) {
      if (["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--config-env"].includes(tokens[index])) index += 2;
      else index++;
    }
    if (tokens[index++] !== "push") return false;
    const args = tokens.slice(index);
    if (args.includes("--dry-run") || args.includes("-n")) return false;
    if (args.some((arg) => ["--all", "--mirror", "--branches"].includes(arg))) return true;
    const positional = [];
    let explicitRepo = false;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (["--repo", "--receive-pack", "--exec", "--push-option", "-o"].includes(arg)) {
        if (arg === "--repo") explicitRepo = true;
        i++; continue;
      }
      if (arg.startsWith("--repo=")) explicitRepo = true;
      if (!arg.startsWith("-")) positional.push(arg);
    }
    const refs = explicitRepo ? positional : positional.slice(1);
    if (!refs.length) return true; // push.default and remote refspecs are unknown
    return refs.some((ref) => {
      const destination = ref.replace(/^\+/, "").split(":").at(-1).replace(/^refs\/heads\//, "");
      return !destination || /[*?$`]/.test(destination) || destination === "HEAD" || branches.includes(destination);
    });
  });
}

/** Context-sensitive writes are flagged without a literal production marker. */
export function isProductionCommand(command, patternSource) {
  if (!command) return null;
  if (patternSource) return new RegExp(patternSource, "i").exec(command)?.[0] ?? null;
  segment: for (const tokens of segments(command)) {
    const text = tokens.join(" ");
    for (const [program, writes] of [
      ["terraform", ["apply", "destroy", "import", "taint", "untaint"]],
      ["kubectl", ["apply", "create", "delete", "replace", "patch", "edit", "scale", "set", "exec", "run", "drain", "cordon", "uncordon", "label", "annotate"]],
      ["helm", ["install", "upgrade", "rollback", "uninstall", "delete"]],
    ]) {
      const index = commandIndex(tokens, program);
      if (index < 0) continue;
      const [verb, action] = subcommands(tokens, index);
      if (writes.includes(verb) || (program === "kubectl" && verb === "rollout" && ["restart", "undo", "pause", "resume"].includes(action)) ||
          (program === "terraform" && verb === "state" && ["rm", "mv", "push", "replace-provider"].includes(action))) return `context-sensitive ${program} write`;
      // An argument named 'release' does not turn a read operation into a write.
      if (["get", "describe", "logs", "status", "list", "plan", "show", "output", "version", "validate", "history", "template"].includes(verb) ||
          (verb === "rollout" && ["status", "history"].includes(action))) continue segment;
    }
    if (/\b(prod|production|live)\b/i.test(text) && /\b(deploy|release|promote|publish|migrate)\b/i.test(text)) return "production-marked write";
  }
  return null;
}

function releaseAcknowledged(value, event) {
  if (!value) return false;
  let approval;
  try { approval = JSON.parse(value); } catch { throw new Error("SDLC_RELEASE_APPROVAL must be scoped JSON {command,cwd,expires,reference}"); }
  if (!object(approval) || typeof approval.reference !== "string" || !approval.reference.trim() ||
      typeof approval.command !== "string" || typeof approval.cwd !== "string" || !Number.isFinite(Date.parse(approval.expires)))
    throw new Error("SDLC_RELEASE_APPROVAL requires command, cwd, expires and reference");
  return approval.command === event.command && path.resolve(approval.cwd) === path.resolve(event.cwd) && Date.parse(approval.expires) > Date.now();
}

export function evaluateEvent(event, env = process.env, checks = ["tests", "push", "production"]) {
  if (checks.includes("tests") && env.SDLC_TEST_PATTERN) new RegExp(env.SDLC_TEST_PATTERN);
  if (checks.includes("production") && env.SDLC_PRODUCTION_PATTERN) new RegExp(env.SDLC_PRODUCTION_PATTERN, "i");
  if (checks.includes("tests") && env.SDLC_PROTECT_TESTS === "1" && env.SDLC_ALLOW_TEST_EDIT !== "1") {
    const protectedPath = event.paths.find((file) => isProtectedTestPath(file, env.SDLC_TEST_PATTERN));
    if (protectedPath) return { allow: false, reason: `Protected regression test: ${protectedPath}. An authorized test correction may use SDLC_ALLOW_TEST_EDIT=1; record the correction and rerun verification.` };
  }
  if (event.operation === "shell") {
    const branches = (env.SDLC_PROTECTED_BRANCHES ?? "main,master").split(",").map((s) => s.trim()).filter(Boolean);
    if (checks.includes("push") && env.SDLC_ALLOW_PUSH_MAIN !== "1" && targetsProtectedBranch(event.command, branches))
      return { allow: false, reason: "Protected or unresolved Git push destination. Use an explicit feature-branch refspec and PR. SDLC_ALLOW_PUSH_MAIN=1 is a local operator override, not workflow approval." };
    const production = checks.includes("production") && isProductionCommand(event.command, env.SDLC_PRODUCTION_PATTERN);
    if (production && !releaseAcknowledged(env.SDLC_RELEASE_APPROVAL, event)) return { allow: false,
      reason: `Possible deployment/write (${production}). Resolve the target and authorization. SDLC_RELEASE_APPROVAL requires expiring JSON {command,cwd,expires,reference} matching this operation; external credential/deployment controls remain authoritative.` };
  }
  return { allow: true, coverage: event.coverage };
}

export function guardPayload(payload, { harness = "auto", env = process.env, checks } = {}) {
  try { return evaluateEvent(normalizeEvent(payload, harness), env, checks); }
  catch (error) { return { allow: false, reason: `SDLC preflight configuration/payload error: ${error.message}` }; }
}

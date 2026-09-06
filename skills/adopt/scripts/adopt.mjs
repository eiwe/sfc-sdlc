#!/usr/bin/env node
// Dependency-free, non-destructive adoption. Local installation is not an
// authorization boundary: an operator must protect enforcement configuration.
import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "0.2.0";
const HARNESSES = ["claude", "codex", "pi", "opencode"];
const DEFAULT_TEMPLATES = fileURLToPath(new URL("../templates/", import.meta.url));
const MARKER = ".sdlc/installation.json";
const JSON_HOOKS = new Set([".claude/settings.json", ".codex/hooks.json"]);
const RELOCATE = {
  "ADR.md": "docs/decisions/ADR-template.md",
  "INTENT.md": "docs/changes/_template/intent.md",
  "SPEC.md": "docs/changes/_template/spec.md",
  "PLAN.md": "docs/changes/_template/plan.md",
};
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function relativePath(value) {
  if (typeof value !== "string" || !value || value.includes("\\") || value.includes("\0") ||
      path.posix.isAbsolute(value) || value.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error(`Unsafe installation path: ${JSON.stringify(value)}`);
  }
  return value;
}

async function statOrNull(filename) {
  try { return await fs.lstat(filename); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

// Inspect every existing component, including the target's parents. The same
// check runs immediately before writes; symlinked destinations are never followed.
async function safePath(filename) {
  const absolute = path.resolve(filename);
  let current = path.parse(absolute).root;
  const parts = absolute.slice(current.length).split(path.sep).filter(Boolean);
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const info = await statOrNull(current);
    if (!info) return;
    if (info.isSymbolicLink()) throw new Error(`Refusing symlink in installation path: ${current}`);
    if (index < parts.length - 1 && !info.isDirectory()) {
      throw new Error(`Installation parent is not a directory: ${current}`);
    }
  }
}

async function readFileOrNull(filename) {
  const info = await statOrNull(filename);
  if (!info) return null;
  if (!info.isFile()) throw new Error(`Installation destination is not a regular file: ${filename}`);
  return fs.readFile(filename, "utf8");
}

async function sourceFiles(directory, prefix = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = relativePath(prefix ? `${prefix}/${entry.name}` : entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in template payload: ${relative}`);
    if (entry.isDirectory()) result.push(...await sourceFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`Unsupported template file: ${relative}`);
  }
  return result;
}

function destination(source, harnesses) {
  if (Object.hasOwn(RELOCATE, source)) return RELOCATE[source];
  const [first, ...rest] = source.split("/");
  if (!first.startsWith("dot-")) return source;
  const native = first.slice(4);
  if (!harnesses.includes(native) && native !== "github" && native !== "sdlc") return null;
  return [`.${native}`, ...rest].join("/");
}

function validateManifest(value) {
  if (!object(value) || value.schemaVersion !== 1 || !object(value.files) ||
      !Array.isArray(value.harnesses) || value.harnesses.some((item) => !HARNESSES.includes(item)) ||
      typeof value.version !== "string" || !object(value.configuration)) {
    throw new Error("Invalid installation manifest; preserve it and resolve manually before adoption.");
  }
  for (const [filename, entry] of Object.entries(value.files)) {
    relativePath(filename);
    if (filename === MARKER || !object(entry) || !/^[a-f0-9]{64}$/.test(entry.sha256) ||
        (entry.manual && !/^[a-f0-9]{64}$/.test(entry.templateSha256))) {
      throw new Error(`Invalid installation manifest entry: ${filename}`);
    }
  }
  return value;
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (object(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function hookConfig(text, filename) {
  const value = JSON.parse(text);
  if (!object(value) || (value.hooks !== undefined && !object(value.hooks))) {
    throw new Error(`${filename} must contain an object with an optional hooks object`);
  }
  for (const registrations of Object.values(value.hooks ?? {})) {
    if (!Array.isArray(registrations)) throw new Error(`${filename} contains a non-array hook registration`);
    for (const entry of registrations) {
      if (!object(entry) || !Array.isArray(entry.hooks)) throw new Error(`${filename} contains an invalid hook registration`);
    }
  }
  return value;
}

// Hook groups are the ownership unit. Remove only byte-equivalent semantic
// groups previously installed by us, retain unrelated settings, then append any
// missing desired groups. Customized managed groups are conflicts, not guesses.
function mergeHooks(existingText, desiredText, previous, filename) {
  const existing = hookConfig(existingText ?? "{}", filename);
  const desired = hookConfig(desiredText, filename);
  const old = previous?.managedHooks;
  const result = structuredClone(existing);
  result.hooks ??= {};
  // A manually completed upgrade may already have replaced the old groups.
  // Accept that only when every desired group is present exactly as specified.
  const desiredInstalled = Object.entries(desired.hooks ?? {}).every(([event, groups]) =>
    groups.every((group) => (existing.hooks?.[event] ?? []).some((item) => stable(item) === stable(group))));
  if (old) {
    for (const [event, groups] of Object.entries(old)) {
      const actual = result.hooks[event] ?? [];
      for (const group of groups) {
        const index = actual.findIndex((item) => stable(item) === stable(group));
        if (index < 0) {
          if (!desiredInstalled) throw new Error(`Previously installed ${event} hook was customized or removed`);
        } else actual.splice(index, 1);
      }
      result.hooks[event] = actual;
    }
  }
  for (const [key, value] of Object.entries(desired)) {
    if (key === "hooks") continue;
    if (Object.hasOwn(result, key) && stable(result[key]) !== stable(value)) {
      throw new Error(`Existing ${key} setting conflicts with template`);
    }
    result[key] = value;
  }
  for (const [event, groups] of Object.entries(desired.hooks ?? {})) {
    result.hooks[event] ??= [];
    for (const group of groups) {
      if (!result.hooks[event].some((item) => stable(item) === stable(group))) {
        result.hooks[event].push(group);
      }
    }
  }
  return { content: json(result), managedHooks: desired.hooks ?? {} };
}

function configure(content, filename, configuration) {
  if (filename === ".github/CODEOWNERS" && configuration.owner) {
    content = content.replaceAll("@OWNER", configuration.owner);
  }
  if (filename === ".github/workflows/ci.yml" && configuration.verifyCommand) {
    const marker = /^( *)# SDLC_VERIFY_COMMAND_BEGIN\r?\n[\s\S]*?^\1# SDLC_VERIFY_COMMAND_END/gm;
    if (!marker.test(content)) throw new Error("CI template is missing SDLC verification command markers");
    marker.lastIndex = 0;
    content = content.replace(marker, (_, indent) => `${indent}# SDLC_VERIFY_COMMAND_BEGIN\n${configuration.verifyCommand.split("\n").map((line) => `${indent}${line}`).join("\n")}\n${indent}# SDLC_VERIFY_COMMAND_END`);
  }
  return content;
}

function validateConfiguration(configuration) {
  if (configuration.verifyCommand !== undefined &&
      (typeof configuration.verifyCommand !== "string" || !configuration.verifyCommand.trim() ||
       /[\0\r]/.test(configuration.verifyCommand) || configuration.verifyCommand.includes("${{"))) {
    throw new Error("Verification command must be nonempty shell text without NUL, CR, or GitHub expression interpolation");
  }
  if (configuration.owner !== undefined &&
      (typeof configuration.owner !== "string" || !/^@[A-Za-z0-9][A-Za-z0-9-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)?$/.test(configuration.owner) ||
       configuration.owner === "@OWNER")) {
    throw new Error("Owner must be a GitHub @user or @organization/team, not @OWNER");
  }
}

function hasVerificationBlock(workflow, command) {
  const expected = `# SDLC_VERIFY_COMMAND_BEGIN\n${command}\n# SDLC_VERIFY_COMMAND_END`;
  const lines = workflow.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const header = /^( *)(- +)?run: *\|[-+]? *(?:#.*)?$/.exec(lines[index]);
    if (!header) continue;
    const keyIndent = header[1].length + (header[2]?.length ?? 0);
    const body = [];
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      const line = lines[cursor];
      if (line.trim() && line.length - line.trimStart().length <= keyIndent) break;
      body.push(line);
    }
    const contentLines = body.filter((line) => line.trim());
    if (!contentLines.length) continue;
    const indent = Math.min(...contentLines.map((line) => line.length - line.trimStart().length));
    const normalized = body.map((line) => line.slice(indent)).join("\n").replace(/\n+$/, "");
    if (normalized === expected) return true;
  }
  return false;
}

async function atomicWrite(filename, content) {
  await safePath(filename);
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await safePath(filename);
  const priorMode = (await statOrNull(filename))?.mode;
  const temporary = `${filename}.sdlc-${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, content, { flag: "wx", mode: priorMode === undefined ? 0o644 : priorMode & 0o777 });
    await fs.rename(temporary, filename);
  } finally {
    await fs.unlink(temporary).catch((error) => { if (error.code !== "ENOENT") throw error; });
  }
}

export async function adopt(options = {}) {
  if (typeof options.target !== "string" || !options.target) throw new Error("--target PATH is required");
  if (options.apply && options.doctor) throw new Error("--doctor is read-only and cannot be combined with --apply");
  const target = path.resolve(options.target);
  await safePath(target);
  const targetStat = await statOrNull(target);
  if (targetStat && !targetStat.isDirectory()) throw new Error("Target must be a directory");
  const markerPath = path.join(target, MARKER);
  await safePath(markerPath);
  const markerText = await readFileOrNull(markerPath);
  const previous = markerText ? validateManifest(JSON.parse(markerText)) : null;
  const harnesses = [...new Set(options.harnesses ?? previous?.harnesses ?? HARNESSES)].sort();
  if (!harnesses.length || harnesses.some((item) => !HARNESSES.includes(item))) {
    throw new Error(`Harnesses must be selected from ${HARNESSES.join(",")}`);
  }
  const configuration = { ...previous?.configuration };
  if (options.verifyCommand !== undefined) configuration.verifyCommand = options.verifyCommand;
  if (options.owner !== undefined) configuration.owner = options.owner;
  validateConfiguration(configuration);
  const acceptExisting = new Set(options.acceptExisting ?? []);
  if (options.doctor && acceptExisting.size) throw new Error("--accept-existing requires preview or --apply; doctor evaluates recorded installation state");
  for (const filename of acceptExisting) {
    relativePath(filename);
    if (!(filename.endsWith(".md") && !filename.startsWith("scripts/")) &&
        ![".github/CODEOWNERS", ".github/workflows/ci.yml", ".sdlc/policy.json"].includes(filename)) {
      throw new Error(`Cannot accept custom executable runtime or hook wiring: ${filename}`);
    }
  }
  const templates = path.resolve(options.templates ?? DEFAULT_TEMPLATES);
  const payload = [];
  const destinations = new Set();
  for (const source of await sourceFiles(templates)) {
    const filename = destination(source, harnesses);
    if (!filename) continue;
    relativePath(filename);
    if (filename === MARKER || destinations.has(filename)) throw new Error(`Conflicting template destination: ${filename}`);
    destinations.add(filename);
    payload.push({ filename, content: configure(await fs.readFile(path.join(templates, source), "utf8"), filename, configuration) });
  }
  for (const filename of acceptExisting) {
    if (!destinations.has(filename)) throw new Error(`Accepted path is not in the selected payload: ${filename}`);
  }
  // All paths are preflighted before the first mutation, including previously
  // tracked files that are absent from a newer payload. No file is ever deleted.
  for (const filename of new Set([...destinations, ...Object.keys(previous?.files ?? {})])) {
    await safePath(path.join(target, filename));
  }

  const report = {
    mode: options.doctor ? "doctor" : options.apply ? "apply" : "preview",
    version: VERSION, target, harnesses, changes: [], conflicts: [], incomplete: [],
    warnings: [
      "Platform branch protection, credentials and operator isolation are not verified by adoption.",
      "The project CI command is not executed by adoption. Autonomous runners require separately reviewed operator configuration; the installed policy is a cooperative sample.",
    ],
  };
  if (harnesses.includes("codex")) report.warnings.push("Codex hook support and project hook trust must be enabled in the installed Codex version.");
  if (!configuration.verifyCommand) report.incomplete.push("Configure the real verification command with --verify-command; generated CI fails until configured.");
  if (!configuration.owner) report.incomplete.push("Configure a real GitHub owner with --owner and review CODEOWNERS coverage.");
  if (options.doctor && !previous) report.incomplete.push("No .sdlc/installation.json marker; existing AGENTS.md alone does not establish adoption.");
  if (options.doctor && previous && previous.version !== VERSION) report.incomplete.push(`Installed version ${previous.version} differs from ${VERSION}; preview and apply adoption.`);

  const files = { ...previous?.files };
  const writes = [];
  for (const { filename, content: desired } of payload) {
    const absolute = path.join(target, filename);
    let existing;
    try { existing = await readFileOrNull(absolute); }
    catch (error) { report.conflicts.push({ path: filename, reason: error.message }); continue; }
    const prior = previous?.files[filename];
    let content = desired;
    let managedHooks;
    if (acceptExisting.has(filename)) {
      if (existing === null) throw new Error(`Cannot accept a missing file: ${filename}`);
      if (filename.endsWith(".json")) JSON.parse(existing);
      files[filename] = { sha256: digest(existing), templateSha256: digest(desired), manual: true };
      report.warnings.push(`Operator-accepted manual integration preserved: ${filename}; this is not runtime compatibility certification.`);
      continue;
    }
    if (prior?.manual && existing !== null && existing !== desired) {
      if (digest(existing) === prior.sha256 && digest(desired) === prior.templateSha256) {
        report.warnings.push(`Previously accepted manual integration preserved: ${filename}`);
      } else {
        report.conflicts.push({ path: filename, reason: "Manually integrated file or its upstream template changed; review the merge and acknowledge with --accept-existing PATH." });
      }
      continue;
    }
    if (JSON_HOOKS.has(filename)) {
      try {
        const merged = mergeHooks(existing, desired, existing === null ? null : prior, filename);
        content = merged.content;
        managedHooks = merged.managedHooks;
      } catch (error) {
        report.conflicts.push({ path: filename, reason: `Settings preserved: ${error.message}` });
        continue;
      }
    } else if (existing !== null && existing !== desired && (!prior || digest(existing) !== prior.sha256)) {
      report.conflicts.push({ path: filename, reason: prior ? "Installed file was customized; merge manually." : "Existing file is not managed by SFC; merge manually." });
      continue;
    }
    if (existing !== content) {
      report.changes.push({ path: filename, action: existing === null ? "create" : JSON_HOOKS.has(filename) ? "merge" : "update" });
      writes.push({ filename, content, existing });
    }
    files[filename] = { sha256: digest(content), ...(managedHooks ? { managedHooks } : {}) };
  }
  for (const filename of Object.keys(previous?.files ?? {})) {
    if (!destinations.has(filename)) report.warnings.push(`Previously installed file retained outside the selected payload: ${filename}`);
  }
  if (report.conflicts.length) report.incomplete.push("Resolve reported file conflicts manually; --accept-existing PATH acknowledges reviewed document/configuration merges, never executable runtime changes.");
  if (options.doctor && report.changes.length) report.incomplete.push("Installation has missing files or available updates; preview and apply adoption.");
  if (options.doctor) {
    const ci = await readFileOrNull(path.join(target, ".github/workflows/ci.yml")).catch(() => null);
    const owners = await readFileOrNull(path.join(target, ".github/CODEOWNERS")).catch(() => null);
    if (configuration.verifyCommand && (!ci || !hasVerificationBlock(ci, configuration.verifyCommand) || /TODO:|SDLC (?:verification command is incomplete|adoption incomplete)/.test(ci))) {
      report.incomplete.push("Installed CI needs the complete configured command inside an executable run: | block between SDLC_VERIFY_COMMAND_BEGIN/END markers, without other commands in that block; required placeholders must be resolved.");
    }
    if (configuration.owner && (!owners || /@OWNER\b/.test(owners) || !owners.split("\n").some((line) => !line.trimStart().startsWith("#") && line.split(/\s+/).includes(configuration.owner)))) {
      report.incomplete.push("Installed CODEOWNERS still has unresolved ownership.");
    }
  }

  const manifest = { schemaVersion: 1, version: VERSION, harnesses, configuration, files };
  const manifestContent = json(manifest);
  const markerChanged = markerText !== manifestContent;
  if (!options.doctor && markerChanged) report.changes.push({ path: MARKER, action: previous ? "update" : "create" });
  if (options.apply) {
    // Recheck bytes before every replacement, to preserve changes made after the
    // preview inside this invocation. This is cooperative safety, not a lock or
    // an adversarial isolation guarantee.
    for (const { filename, content, existing } of writes) {
      const absolute = path.join(target, filename);
      await safePath(absolute);
      if (await readFileOrNull(absolute) !== existing) throw new Error(`File changed during adoption: ${filename}`);
      await atomicWrite(absolute, content);
    }
    if (markerChanged) {
      await safePath(markerPath);
      if (await readFileOrNull(markerPath) !== markerText) throw new Error("Installation manifest changed during adoption");
      await atomicWrite(markerPath, manifestContent);
    }
  }
  report.ok = report.conflicts.length === 0 && (!options.doctor || report.incomplete.length === 0);
  return report;
}

function argumentsFor(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === "--apply") options.apply = true;
    else if (flag === "--doctor") options.doctor = true;
    else if (flag === "--help" || flag === "-h") options.help = true;
    else if (["--target", "--harnesses", "--verify-command", "--owner", "--accept-existing"].includes(flag)) {
      const value = argv[++index];
      if (value === undefined || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
      const key = { "--target": "target", "--harnesses": "harnesses", "--verify-command": "verifyCommand", "--owner": "owner", "--accept-existing": "acceptExisting" }[flag];
      if (flag === "--accept-existing") (options.acceptExisting ??= []).push(value);
      else options[key] = flag === "--harnesses" ? value.split(",") : value;
    } else throw new Error(`Unknown argument: ${flag}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = argumentsFor(process.argv.slice(2));
    if (options.help) {
      process.stdout.write("Usage: node adopt.mjs --target PATH [--harnesses claude,codex,pi,opencode] [--verify-command 'npm test'] [--owner '@name'] [--accept-existing PATH ...] [--apply | --doctor]\nDefault: preview only; all four harnesses on first adoption. --accept-existing is repeatable and acknowledges a reviewed manual document/configuration merge. No commits or platform writes.\n");
    } else {
      const report = await adopt(options);
      process.stdout.write(json(report));
      if (!report.ok) process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`Adoption failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

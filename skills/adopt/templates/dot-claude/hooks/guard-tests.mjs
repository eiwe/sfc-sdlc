#!/usr/bin/env node
/*
 * Spec-First SDLC — PreToolUse test guard for Claude Code.
 * During a bug fix the engineer sets SDLC_PROTECT_TESTS=1 after committing the
 * failing test; this guard then blocks edits to test files so the agent fixes the
 * code, not the test. Inactive unless SDLC_PROTECT_TESTS=1.
 *
 * Cross-platform: runs under Node (required by both Claude Code and Pi), so it
 * works on Windows, macOS, and Linux regardless of shell.
 *
 * Protocol: reads the PreToolUse JSON on stdin. Exit 0 = allow; exit 2 = block
 * (stderr is shown to the agent). Any error fails open (allows) so the guard can
 * never wedge a session.
 *
 * Config via env:
 *   SDLC_PROTECT_TESTS=1     activate the guard (set during a bug fix).
 *   SDLC_ALLOW_TEST_EDIT=1   escape hatch: allow a test edit for this session
 *                            (use only when the test itself was wrong and a human agreed).
 *   SDLC_TEST_PATTERN        optional JS regex source that replaces the default test-path set.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

// Default set: common test directories and filename conventions across languages.
const DEFAULT_TEST_PATTERN = [
  "(^|/)(test|tests|__tests__|spec|specs)/",
  "\\.(test|spec)\\.[cm]?[jt]sx?$",
  "(^|/)test_[^/]+\\.py$",
  "_test\\.(go|py|rb|rs|ex|exs)$",
  "Tests?\\.(java|kt|cs|swift|scala)$",
].join("|");

export function isProtectedTestPath(filePath, patternSource) {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, "/");
  const source = patternSource || DEFAULT_TEST_PATTERN;
  return new RegExp(source).test(normalized);
}

async function readStdin() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
  return raw;
}

async function main() {
  if (process.env.SDLC_PROTECT_TESTS !== "1") process.exit(0);
  if (process.env.SDLC_ALLOW_TEST_EDIT === "1") process.exit(0);

  let raw = "";
  try {
    raw = await readStdin();
  } catch {
    process.exit(0); // fail open
  }

  let filePath = "";
  try {
    const payload = JSON.parse(raw || "{}");
    const name = payload.tool_name || payload.toolName;
    if (!["Edit", "Write", "MultiEdit"].includes(name)) process.exit(0);
    const input = payload.tool_input || payload.toolInput || {};
    filePath = input.file_path || input.filePath || "";
  } catch {
    process.exit(0); // not JSON we understand — don't interfere
  }

  if (isProtectedTestPath(filePath, process.env.SDLC_TEST_PATTERN)) {
    process.stderr.write(
      `Blocked by Spec-First SDLC: editing a test file (${filePath}) while SDLC_PROTECT_TESTS=1. ` +
        "During a bug fix, fix the code, not the test — the failing test committed first is the proof. " +
        "If the test itself was wrong and a human agreed, they relaunch the session with " +
        "SDLC_ALLOW_TEST_EDIT=1 in its environment; setting it inline in a command does not count."
    );
    process.exit(2);
  }

  process.exit(0);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}

#!/usr/bin/env node
/*
 * Spec-First SDLC — PreToolUse push guard for Claude Code.
 * Blocks Bash `git push` commands that target a protected (default) branch,
 * enforcing "no direct pushes to the default branch — use a PR".
 *
 * Cross-platform: runs under Node (required by both Claude Code and Pi), so it
 * works on Windows, macOS, and Linux regardless of shell.
 *
 * Protocol: reads the PreToolUse JSON on stdin. Exit 0 = allow; exit 2 = block
 * (stderr is shown to the agent). Any error fails open (allows) so the guard can
 * never wedge a session.
 *
 * Config via env:
 *   SDLC_PROTECTED_BRANCHES  comma-separated (default: "main,master")
 *   SDLC_ALLOW_PUSH_MAIN=1   escape hatch to allow this push
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

function protectedBranchList() {
  return (process.env.SDLC_PROTECTED_BRANCHES || "main,master")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
}

// A protected branch used as an explicit push target within the same `git push`
// segment (i.e. `... main`, `... HEAD:main`, `... main;`), not merely a substring
// like `feature/main-thing` or a different branch like `main-branch`.
export function targetsProtectedBranch(command, branches) {
  const branchAlt = branches
    .map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  if (!branchAlt) return false;
  return new RegExp(
    `git\\s+push[^&|;]*(?:\\s|:)(${branchAlt})(?![\\w/.-])`
  ).test(command);
}

async function readStdin() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
  return raw;
}

async function main() {
  const branches = protectedBranchList();

  if (process.env.SDLC_ALLOW_PUSH_MAIN === "1") process.exit(0);

  let raw = "";
  try {
    raw = await readStdin();
  } catch {
    process.exit(0); // fail open
  }

  let command = "";
  try {
    const payload = JSON.parse(raw || "{}");
    if ((payload.tool_name || payload.toolName) !== "Bash") process.exit(0);
    command = (payload.tool_input || payload.toolInput || {}).command || "";
  } catch {
    process.exit(0); // not JSON we understand — don't interfere
  }

  if (targetsProtectedBranch(command, branches)) {
    process.stderr.write(
      "Blocked by Spec-First SDLC: direct push to a protected branch " +
        `(${branches.join(", ")}). Open a pull request instead. ` +
        "If a human approved this push, they set SDLC_ALLOW_PUSH_MAIN=1 in the environment " +
        "Claude Code was launched with; setting it inline in this command does not count."
    );
    process.exit(2);
  }

  process.exit(0);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}

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

const protectedBranches = (process.env.SDLC_PROTECTED_BRANCHES || "main,master")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

function allow() {
  process.exit(0);
}

if (process.env.SDLC_ALLOW_PUSH_MAIN === "1") allow();

let raw = "";
try {
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
} catch {
  allow(); // fail open
}

let command = "";
try {
  const payload = JSON.parse(raw || "{}");
  if ((payload.tool_name || payload.toolName) !== "Bash") allow();
  command = (payload.tool_input || payload.toolInput || {}).command || "";
} catch {
  allow(); // not JSON we understand — don't interfere
}

// A protected branch used as an explicit push target within the same `git push`
// segment (i.e. `... main`, `... HEAD:main`, `... main;`), not merely a substring
// like `feature/main-thing` or a different branch like `main-branch`.
const branchAlt = protectedBranches
  .map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
const targetsProtected = new RegExp(
  `git\\s+push[^&|;]*(?:\\s|:)(${branchAlt})(?![\\w/.-])`
).test(command);

if (targetsProtected) {
  process.stderr.write(
    "Blocked by Spec-First SDLC: direct push to a protected branch " +
      `(${protectedBranches.join(", ")}). Open a pull request instead. ` +
      "Override for this push with SDLC_ALLOW_PUSH_MAIN=1 if a human approved it."
  );
  process.exit(2);
}

allow();

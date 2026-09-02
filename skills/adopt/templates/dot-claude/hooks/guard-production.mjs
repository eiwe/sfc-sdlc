#!/usr/bin/env node
/*
 * Spec-First SDLC — PreToolUse production guard for Claude Code.
 * Blocks a Bash command that looks like a production deploy/write unless a named
 * human authorization is present, enforcing the production boundary: the agent may
 * act up to the production gate and never past it.
 *
 * Cross-platform: runs under Node (required by both Claude Code and Pi), so it
 * works on Windows, macOS, and Linux regardless of shell.
 *
 * Protocol: reads the PreToolUse JSON on stdin. Exit 0 = allow; exit 2 = block
 * (stderr is shown to the agent). Any error fails open (allows) so the guard can
 * never wedge a session.
 *
 * Config via env:
 *   SDLC_RELEASE_APPROVAL    the authorization: an approver's name or a change ticket.
 *                            When set to a non-empty value, the command is allowed.
 *   SDLC_PRODUCTION_PATTERN  optional JS regex source (case-insensitive) that replaces
 *                            the default production-command detection.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

// Default: a command counts as a production write only when it pairs a deploy-ish
// verb with a production marker, so `make deploy` to staging or `git apply` a patch
// do not trip it. A custom SDLC_PRODUCTION_PATTERN replaces this entirely.
const DEFAULT_VERB = /(deploy|release|rollout|promote|publish|migrate|apply|terraform|kubectl|helm)/i;
const DEFAULT_MARKER = /\b(prod|production|live)\b/i;

// Returns the matched text (a truthy string) when the command looks like a
// production deploy/write, or null when it does not.
export function isProductionCommand(command, patternSource) {
  if (!command) return null;
  if (patternSource) {
    const match = new RegExp(patternSource, "i").exec(command);
    return match ? match[0] : null;
  }
  const verb = DEFAULT_VERB.exec(command);
  const marker = DEFAULT_MARKER.exec(command);
  if (verb && marker) return `${verb[0]} … ${marker[0]}`;
  return null;
}

async function readStdin() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
  return raw;
}

async function main() {
  const approval = (process.env.SDLC_RELEASE_APPROVAL || "").trim();
  if (approval) process.exit(0);

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

  const matched = isProductionCommand(command, process.env.SDLC_PRODUCTION_PATTERN);
  if (matched) {
    process.stderr.write(
      `Blocked by Spec-First SDLC: this looks like a production deploy/write (${matched}). ` +
        "Production changes need a named human authorization. A release manager authorizes by " +
        "launching the session with SDLC_RELEASE_APPROVAL=<approver or ticket> in its environment; " +
        "setting it inline in this command does not count."
    );
    process.exit(2);
  }

  process.exit(0);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}

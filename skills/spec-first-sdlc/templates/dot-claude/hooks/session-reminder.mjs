#!/usr/bin/env node
/*
 * Spec-First SDLC — SessionStart reminder for Claude Code.
 * Prints the read-first checklist; Claude Code injects stdout as context.
 * Fires on startup/resume/clear/compact, so the rules are re-surfaced even
 * after context compaction. Node (not shell echo) for cross-platform output.
 */
process.stdout.write(
  "Spec-First SDLC: read HANDOFF.md then AGENTS.md before acting; " +
    "honor the decision/spec/test/review/handoff gates; " +
    "update HANDOFF.md before ending the session."
);

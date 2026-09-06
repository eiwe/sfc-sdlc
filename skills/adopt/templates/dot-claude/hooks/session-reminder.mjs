#!/usr/bin/env node
/*
 * Spec-First SDLC — SessionStart reminder for Claude Code.
 * Prints the read-first checklist; Claude Code injects stdout as context.
 * Fires on startup/resume/clear/compact, so the rules are re-surfaced even
 * after context compaction. Node (not shell echo) for cross-platform output.
 */
process.stdout.write(
  "Spec-First SDLC: read HANDOFF.md, then AGENTS.md, then the active change's " +
    "docs/changes/<slug>/ (intent.md, spec.md, plan.md) before acting. " +
    "Follow AGENTS.md for stage gates, minor-change exceptions and escalation. " +
    "Recorded authorization survives resume and compaction. Read-only investigation " +
    "does not require a plan or handoff edit. Verify changes using project commands; " +
    "update durable handoff state when work changes it."
);

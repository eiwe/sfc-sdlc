---
name: adopt
description: >-
  Adopts and runs the Spec-First Collaborative SDLC — a document-driven workflow
  (AGENTS.md as source of truth, PRDs, ADRs, HANDOFF, CHANGELOG, and mandatory
  decision/spec/test/review/handoff gates) that stays in context across sessions
  and context compaction in both Claude Code and the Pi coding harness. Use when
  the user wants to start, adopt, set up, scaffold, or follow the Spec-First (SFC)
  SDLC in a repository, generate its AGENTS.md / CLAUDE.md and enforcement hooks,
  or bootstrap a spec-first process for AI-agent development.
license: MIT
---

# Spec-First Collaborative SDLC

A document-driven lifecycle for building software with AI agents. Requirements
and decisions are written before code, and the durable rules live in a context
file the harness reloads every session — so the process survives new sessions,
`/clear`, and context compaction.

This skill only needs to be invoked **once per repo, to bootstrap** it. After that,
the SDLC applies automatically every session in both harnesses via the installed
`AGENTS.md` / `CLAUDE.md` — no further invocation. It is invoked as:

- **Claude Code:** `/sdlc:adopt` (plugin) or `/adopt` (standalone skill), or just ask in natural language ("adopt the spec-first SDLC in this repo").
- **Pi:** `/skill:adopt`, or ask in natural language.

The templates this skill installs are bundled next to this file, in `./templates/`
(relative to this `SKILL.md`). Read them from the skill's own directory.

---

## Task A — Adopt the SDLC into a repository

Do this when the user asks to start / adopt / set up the SDLC. Locate the bundled
`templates/` directory next to this SKILL.md, then:

1. **Copy the context files to the repo root:**
   - `templates/AGENTS.md` → `AGENTS.md` (the single source of truth; Pi reads it natively).
   - `templates/CLAUDE.md` → `CLAUDE.md` (a one-line `@AGENTS.md` bridge; Claude Code reads this, not AGENTS.md).
2. **Copy the discipline docs to the repo root:**
   - `templates/HANDOFF.md`, `templates/CHANGELOG.md`, `templates/TESTING.md`.
3. **Create the decision/spec directories and seed their templates:**
   - `docs/decisions/` (put `templates/ADR.md` there as `ADR-template.md`).
   - `docs/prd/` (put `templates/PRD.md` there as `PRD-template.md`).
4. **Install enforcement (rename the `dot-` payload dirs on copy):**
   - `templates/dot-github/pull_request_template.md` → `.github/pull_request_template.md`.
   - `templates/dot-github/workflows/ci.yml` → `.github/workflows/ci.yml` (fill in real build/test commands).
   - `templates/dot-claude/settings.json` → `.claude/settings.json` (Claude Code SessionStart reminder + PreToolUse push-guard).
   - `templates/dot-claude/hooks/guard-push.mjs` → `.claude/hooks/guard-push.mjs` (cross-platform Node push-guard).
   - `templates/dot-claude/hooks/session-reminder.mjs` → `.claude/hooks/session-reminder.mjs` (cross-platform Node reminder printer).
   - `templates/scripts/check-changelog.mjs` → `scripts/check-changelog.mjs`
     (dependency-free dated/concise changelog gate).
5. **Fill in project specifics** in `AGENTS.md`: the one-paragraph project summary, the exact build/test/lint commands, architecture notes, and the default branch name.
6. **Write the initial `HANDOFF.md`** describing the project's current state and the first priority.
7. **Commit the scaffolded files** (`AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, `CHANGELOG.md`, `TESTING.md`, `docs/`, `.github/`, `.claude/`). Committing is what makes the SDLC automatic and portable: every future session — for the user, for teammates, and in both Claude Code and Pi — auto-loads these with no skill invocation, even after context compaction.
8. **Tell the user** the SDLC is adopted and now applies automatically (no need to invoke this skill again); that `AGENTS.md` is the source of truth read every session by both harnesses; and that the hard gates need one manual step — enabling GitHub branch protection on the default branch (require a PR, an approving review, and the CI check; block direct pushes). The exact `gh` command is in `GITHUB_WORKFLOW.md` in this skill's source repo (https://github.com/eiwe/sfc-sdlc), not in the adopted project.

Adoption is complete only when `AGENTS.md` + `CLAUDE.md` exist at the repo root, `AGENTS.md` contains the real project commands, and the files are committed.

## Task B — Follow the SDLC on an existing project

If the repo already has `AGENTS.md`, do not re-adopt. Instead:

1. Read `HANDOFF.md`, then `AGENTS.md`, then any PRD/ADR relevant to the task.
2. Confirm scope with the user if it is unclear.
3. Apply the phases and gates below.

---

## Phases

1. **Understand (every session and after every compaction):** read `HANDOFF.md`, then `AGENTS.md`, then the relevant `docs/decisions/` and PRD/spec.
2. **Decide:** if the change involves a significant architecture/product/design choice, write or update an ADR (`docs/decisions/`) before implementing.
3. **Specify:** if the change is non-trivial, write or update a PRD (`docs/prd/`) before implementing.
4. **Implement:** short-lived branch off the default branch; conventional commits; tests for new behavior and fixed bugs.
5. **Verify:** run the test suite and static checks; do live verification where applicable; update affected docs.
6. **Review:** open a PR using the template; adversarial review for non-trivial changes.
7. **Hand off before merge:** add the dated concise `CHANGELOG.md` entry and update
   `HANDOFF.md` to the anticipated post-merge state in the same PR.

## Gates (a change may not merge until all pass)

1. **Decision gate** — ADR written or explicitly not needed.
2. **Spec gate** — PRD written or explicitly not needed.
3. **Test gate** — suite passes; new behavior covered.
4. **Review gate** — PR approved; context checklist complete.
5. **Handoff gate** — dated concise CHANGELOG entry and anticipated post-merge
   HANDOFF state are in the PR.

## Hard rules

- Never implement a non-trivial feature without a PRD, or change a settled design without a superseding ADR.
- Never skip the test gate or claim verification that was not performed.
- Never commit secrets, tokens, or machine-specific paths.
- Never write to production systems without explicit human confirmation.
- Never end a session without updating `HANDOFF.md`.
- Never use the changelog as a session transcript: one ISO-dated logical outcome,
  no more than 100 words, with a durable PR, issue, or ADR reference.

These same rules ship in the installed `AGENTS.md` so they stay in context in every
session of both Claude Code and Pi, even after compaction — this skill body does not.

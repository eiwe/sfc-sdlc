---
name: adopt
description: >-
  Adopts and runs the Spec-First Collaborative SDLC — a document-driven workflow that
  implements Anthropic's AI-Native SDLC Playbook (Plan, Design, Build, Test, Deploy,
  Maintain) for both Claude Code and Pi. AGENTS.md is the cross-harness source of truth;
  each change carries a committed intent.md → spec.md → plan.md chain, ADRs, a REVIEW.md
  review policy, HANDOFF, and a dated CHANGELOG, behind seven merge gates (intent,
  decision, spec, plan, test, review, handoff) and a production boundary enforced by
  hooks and CI. Use when the user wants to start, adopt, set up, scaffold, or follow the
  Spec-First (SFC) SDLC in a repository, generate its AGENTS.md / CLAUDE.md and
  enforcement hooks, or bootstrap a spec-first process for AI-agent development.
license: MIT
---

# Spec-First Collaborative SDLC

A document-driven lifecycle for building software with AI agents, implementing
Anthropic's AI-Native SDLC Playbook. Requirements and decisions are written before
code — as a committed `intent.md` → `spec.md` → `plan.md` chain per change — and the
durable rules live in a context file the harness reloads every session, so the process
survives new sessions, `/clear`, and context compaction.

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
   - `templates/REVIEW.md` → `REVIEW.md` (the review policy for humans and AI reviewers).
3. **Seed the decision and change-chain templates:**
   - `docs/decisions/` — put `templates/ADR.md` there as `ADR-template.md`.
   - `docs/changes/_template/` — put `templates/INTENT.md`, `templates/SPEC.md`, `templates/PLAN.md`
     there as `intent.md`, `spec.md`, `plan.md`. A real change copies this folder to `docs/changes/<slug>/`.
4. **Install enforcement (rename the `dot-` payload dirs on copy):**
   - `templates/dot-github/pull_request_template.md` → `.github/pull_request_template.md`.
   - `templates/dot-github/CODEOWNERS` → `.github/CODEOWNERS` (replace the `@OWNER` placeholder with a real user/team).
   - `templates/dot-github/workflows/ci.yml` → `.github/workflows/ci.yml` (fill in real build/test commands).
   - `templates/dot-claude/settings.json` → `.claude/settings.json` (SessionStart reminder + PreToolUse guards).
   - `templates/dot-claude/hooks/session-reminder.mjs`, `guard-push.mjs`, `guard-production.mjs`, `guard-tests.mjs` → `.claude/hooks/`.
   - `templates/dot-claude/agents/verifier.md`, `reviewer.md` → `.claude/agents/` (Claude Code only; Pi uses a second session/worktree).
   - `templates/scripts/check-changelog.mjs` → `scripts/check-changelog.mjs` (dependency-free dated/concise changelog gate).
5. **Fill in project specifics** in `AGENTS.md`: the one-paragraph project summary, the exact build/test/lint commands (each with a healthy-output example), architecture notes, and the default branch name.
6. **Write the initial `HANDOFF.md`** describing the project's current state and the first priority.
7. **Commit the scaffolded files** (`AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, `CHANGELOG.md`, `TESTING.md`, `REVIEW.md`, `docs/`, `.github/`, `.claude/`, `scripts/`). Committing is what makes the SDLC automatic and portable: every future session — for the user, for teammates, and in both Claude Code and Pi — auto-loads these with no skill invocation, even after context compaction.
8. **Tell the user** the SDLC is adopted and now applies automatically (no need to invoke this skill again); that `AGENTS.md` is the source of truth read every session by both harnesses; and that the hard gates need two manual steps — enabling GitHub branch protection on the default branch (require a PR, an approving review, a code-owner review, and the CI check; block direct pushes) and setting a real owner in `.github/CODEOWNERS`. The exact `gh` command is in `GITHUB_WORKFLOW.md` in this skill's source repo (https://github.com/eiwe/sfc-sdlc), not in the adopted project.

Adoption is complete only when `AGENTS.md` + `CLAUDE.md` + `REVIEW.md` exist at the repo root, `docs/changes/_template/` holds the intent/spec/plan templates, `AGENTS.md` contains the real project commands, and the files are committed.

## Task B — Follow the SDLC on an existing project

If the repo already has `AGENTS.md`, do not re-adopt. Instead:

1. Read `HANDOFF.md`, then `AGENTS.md`, then the active change's `docs/changes/<slug>/` (intent/spec/plan) and the relevant ADRs.
2. Confirm scope with the user if it is unclear.
3. Apply the stages and gates below.

---

## Stages

- **Session start (every session and after every compaction):** read `HANDOFF.md` → `AGENTS.md` → the active change's `intent.md`/`spec.md`/`plan.md` → the relevant ADRs.
- **Plan:** capture the idea as `docs/changes/<slug>/intent.md` in the originator's own words; the product owner accepts it.
- **Design:** produce `spec.md` from the accepted intent, applying policy; the owner resolves flagged concerns with their policy owners and accepts it.
- **Build:** agree `plan.md` before any edits (files that change, order, risks, proof); implement against it, updating `plan.md` in the same commit on any deviation.
- **Test:** verify through the feedback loop (single command, quantifiable target); bug fixes write the failing test first; paste the verification output.
- **Deploy:** open a PR with the template; run the `REVIEW.md` passes (human and/or AI) and resolve Important findings; a human code owner approves; the agent never crosses the production boundary.
- **Maintain:** incidents, scans, and monitoring breaches re-enter the loop as a new `intent.md`; every fixed incident adds a regression test.

## Gates (a change may not merge until all pass) — these seven, in order

1. **Intent gate** — `intent.md` accepted by the product owner (or a linked tracker record), or explicitly not needed (trivial).
2. **Decision gate** — every significant decision has an ADR in `docs/decisions/`, or explicitly not needed.
3. **Spec gate** — `spec.md` accepted with all flagged concerns resolved, or explicitly not needed (trivial).
4. **Plan gate** — `plan.md` approved before implementation started; the merged diff matches it or `plan.md` records the deviation.
5. **Test gate** — the suite passes in CI; new behavior and fixed bugs are covered; verification output is in the PR.
6. **Review gate** — PR uses the template; `REVIEW.md` passes were run and Important findings resolved; a human code owner approved.
7. **Handoff gate** — dated, concise `CHANGELOG.md` entry and anticipated post-merge `HANDOFF.md` state are in the PR.

## Production boundary

Not a merge gate but an action boundary: the agent acts up to the production gate and
never past it. Any production write or deploy needs a named human authorization
(`SDLC_RELEASE_APPROVAL=<approver or ticket>`), enforced by `guard-production.mjs` and
by branch protection (agent output always arrives as a PR).

## Hard rules

- Never implement a non-trivial change without an accepted `intent.md`, `spec.md`, and approved `plan.md`; never change a settled design without a superseding ADR.
- Never start editing code before the plan is approved; when the implementation departs from `plan.md`, update `plan.md` in the same commit.
- Never skip the test gate, never claim verification that was not performed, and always paste the verification output.
- When fixing a bug, write the failing test first and commit it; then fix the code, never the test.
- Never commit secrets, tokens, or machine-specific paths.
- Never deploy to or write to production, or push directly to the default branch, without a named human authorization.
- When the same mistake is made twice, put the correction in `AGENTS.md` under "Things agents get wrong" in that same PR.
- Never end a session without updating `HANDOFF.md`.
- Never use `CHANGELOG.md` as a session transcript: one ISO-dated outcome, ≤100 words, with a durable PR, issue, or ADR reference.

These same rules ship in the installed `AGENTS.md` so they stay in context in every
session of both Claude Code and Pi, even after compaction — this skill body does not.

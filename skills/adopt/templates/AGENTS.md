# AGENTS.md

Universal, tool-agnostic project rules. This file is the single source of truth
for how work happens here.

> **Why this file is authoritative.** Both harnesses load it into context every
> session and re-establish it from disk after context compaction:
> - **Pi** reads `AGENTS.md` natively (injected into the system prompt every session).
> - **Claude Code** reads `CLAUDE.md`, which imports this file via `@AGENTS.md`.
>
> Keep durable rules here — not in chat and not in a skill body, which do not survive compaction.

## Session start — do this every session and after every compaction

Before writing or changing anything:

1. Read `HANDOFF.md` — what was left unfinished, blockers, current priorities.
2. Re-read the rules below.
3. Read the relevant `docs/decisions/` (ADRs) and `docs/prd/` (PRDs) for the task.
4. If scope is unclear, confirm with the human before acting.

## Project

<!-- One-paragraph summary of what this project does and who it is for. -->

## Commands

<!-- Exact commands. These must be real — agents rely on them. -->

```bash
# Build / compile:
# Test (the test gate runs this):
# Lint / type-check:
# Run locally:
```

- **Default branch:** `main`  <!-- or master -->

## Gates — a change may not merge until all pass

1. **Decision gate** — significant architecture/product/design choice has an ADR in `docs/decisions/`, or is explicitly not needed.
2. **Spec gate** — non-trivial change has a PRD in `docs/prd/`, or is explicitly not needed.
3. **Test gate** — the test suite passes and new behavior/bug fixes are covered (see `TESTING.md`).
4. **Review gate** — PR opened with the template; context checklist complete; adversarial review for non-trivial changes.
5. **Handoff gate** — dated concise `CHANGELOG.md` entry and anticipated post-merge
   `HANDOFF.md` state are in the PR before merge.

## Hard rules

- Never implement a non-trivial feature without a PRD, or change a settled design without a superseding ADR.
- Never skip the test gate, and never claim verification that was not actually performed.
- Never commit secrets, tokens, or machine-specific paths.
- Never write to production systems, or push directly to the default branch, without explicit human confirmation.
- Never end a session without updating `HANDOFF.md`.
- Never use `CHANGELOG.md` as a session transcript. Keep one ISO-dated outcome per
  entry, no more than 100 words, and link the durable PR, issue, or ADR.

## Significant means (write an ADR)

- Introduces a new dependency or runtime.
- Changes how state is stored or shared.
- Alters a previously accepted design.
- Has security, privacy, or cost implications.
- Would surprise another agent picking up the project.

## Architecture

<!-- Brief summary of the architecture and where key things live. -->

## Do not change

<!-- Settled decisions that must not be reopened without a superseding ADR. -->

## Where things live

- Decisions (ADRs): `docs/decisions/`
- Product requirements (PRDs): `docs/prd/`
- Release log: `CHANGELOG.md` (validated by `node scripts/check-changelog.mjs CHANGELOG.md`)
- Handoff / living status: `HANDOFF.md`
- Test policy: `TESTING.md`
- Enforcement: `.github/workflows/ci.yml`, branch protection, `.claude/settings.json`

# AGENTS.md

Universal, tool-agnostic project rules — the single source of truth for how work
happens here. This SDLC implements Anthropic's AI-Native SDLC Playbook.

> **Why this file is authoritative.** Both harnesses reload it every session and after compaction:
> - **Pi** reads `AGENTS.md` natively (injected into the system prompt every session).
> - **Claude Code** reads `CLAUDE.md`, which imports this file via `@AGENTS.md`.
> - Durable rules live here — not in chat and not in a skill body, which do not survive compaction.

## Session start — do this every session and after every compaction

1. Read `HANDOFF.md` — what was left unfinished, blockers, current priorities.
2. Re-read the rules below.
3. Read the active change's `docs/changes/<slug>/` (`intent.md`, `spec.md`, `plan.md`) and the relevant ADRs.
4. If scope is unclear, confirm with the human before acting.

## Project

<!-- One-paragraph summary of what this project does and who it is for. -->

## Commands

<!-- Exact commands. These must be real — agents rely on them. Show a healthy result. -->

```bash
# Build / compile:     # healthy: <what success looks like>
# Test (test gate):    # healthy: <e.g. "N passed, 0 failed">
# Lint / type-check:   # healthy: <e.g. "zero warnings">
# Run locally:         # healthy: <e.g. "serving on :8080">
```

- **Default branch:** `main`  <!-- or master -->

## Gates — a change may not merge until all pass

1. **Intent gate** — `docs/changes/<slug>/intent.md` accepted by the product owner (or a linked tracker record), or not needed (trivial).
2. **Decision gate** — every significant decision has an ADR in `docs/decisions/`, or not needed.
3. **Spec gate** — `spec.md` accepted with all flagged concerns resolved, or not needed (trivial).
4. **Plan gate** — `plan.md` approved before implementation; the merged diff matches it or `plan.md` records the deviation.
5. **Test gate** — the suite passes in CI; new behavior and fixed bugs are covered; verification output is in the PR.
6. **Review gate** — PR uses the template; `REVIEW.md` passes were run and Important findings resolved; a human code owner approved.
7. **Handoff gate** — dated, concise `CHANGELOG.md` entry and anticipated post-merge `HANDOFF.md` state are in the PR.

## Production boundary

The agent acts up to the production gate and never past it: any production write or deploy needs a named human authorization (`SDLC_RELEASE_APPROVAL`), enforced by `guard-production.mjs` and branch protection.

## Hard rules

- Never implement a non-trivial change without an accepted `intent.md`, `spec.md`, and approved `plan.md`; never change a settled design without a superseding ADR.
- Never start editing code before the plan is approved; when the implementation departs from `plan.md`, update `plan.md` in the same commit.
- Never skip the test gate, never claim verification that was not performed, and always paste the verification output.
- When fixing a bug, write the failing test first and commit it; then fix the code, never the test.
- Never commit secrets, tokens, or machine-specific paths.
- Never deploy to or write to production, or push directly to the default branch, without a named human authorization.
- When the same mistake is made twice, put the correction in "Things agents get wrong" below in that same PR.
- Never end a session without updating `HANDOFF.md`.
- Never use `CHANGELOG.md` as a session transcript — one ISO-dated outcome per entry, ≤100 words, with a durable reference.

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

## Things agents get wrong

<!-- When an agent makes the same mistake twice, or review flags it twice, the correction goes here in that PR. -->

## Where things live

- Change chain (intent/spec/plan): `docs/changes/<slug>/`
- Decisions (ADRs): `docs/decisions/`
- Review policy: `REVIEW.md`
- Release log: `CHANGELOG.md` (validated by `node scripts/check-changelog.mjs CHANGELOG.md`)
- Handoff / living status: `HANDOFF.md`
- Test policy: `TESTING.md`
- Enforcement: `.github/workflows/ci.yml`, `.github/CODEOWNERS`, branch protection, `.claude/settings.json`, `.claude/hooks/`

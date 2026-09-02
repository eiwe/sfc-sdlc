# AGENTS.md

Universal, tool-agnostic project rules and the single source of truth. This project
follows the Spec-First Collaborative SDLC, which implements Anthropic's AI-Native SDLC
Playbook. Loaded into context every session by both harnesses (Pi natively; Claude
Code via `CLAUDE.md`'s `@AGENTS.md` import) and rebuilt from disk after compaction.

## Session start — do this every session and after every compaction

1. Read `HANDOFF.md` — priorities, blockers, where to resume.
2. Re-read the rules below.
3. Read the active change's `docs/changes/<slug>/` (`intent.md`, `spec.md`, `plan.md`) and the relevant ADRs.
4. If scope is unclear, confirm with the human before acting.

## Project

`notekeep` is a small command-line note manager for a single user. It stores notes
locally and supports create, list, search, and (in progress) tagging.

## Commands

```bash
# Build / install (editable):   pip install -e .        # healthy: "Successfully installed notekeep"
# Test (the test gate runs):    pytest -q               # healthy: "N passed in 0.Ns"
# Lint / type-check:            ruff check . && mypy notekeep   # healthy: "All checks passed!" + "no issues found"
# Run locally:                  notekeep --help          # healthy: prints the command usage
```

- **Default branch:** `main`

## Gates — a change may not merge until all pass

1. **Intent gate** — `docs/changes/<slug>/intent.md` accepted, or not needed (trivial).
2. **Decision gate** — significant choice has an ADR in `docs/decisions/`, or not needed.
3. **Spec gate** — `spec.md` accepted with flagged concerns resolved, or not needed (trivial).
4. **Plan gate** — `plan.md` approved before implementation; the diff matches it or `plan.md` records the deviation.
5. **Test gate** — `pytest -q` passes in CI; new behavior/bug fixes covered; verification output in the PR.
6. **Review gate** — PR uses the template; `REVIEW.md` passes run and Important findings resolved; a code owner approved.
7. **Handoff gate** — dated concise `CHANGELOG.md` entry and anticipated post-merge `HANDOFF.md` state are in the PR.

## Production boundary

The agent acts up to the production gate and never past it: any production write or deploy needs a named human authorization (`SDLC_RELEASE_APPROVAL`), enforced by `guard-production.mjs` and branch protection.

## Hard rules

- Never implement a non-trivial change without an accepted `intent.md`, `spec.md`, and approved `plan.md`; never change a settled design without a superseding ADR.
- Never start editing code before the plan is approved; when the implementation departs from `plan.md`, update `plan.md` in the same commit.
- Never skip the test gate, never claim verification that was not performed, and always paste the verification output.
- When fixing a bug, write the failing test first and commit it; then fix the code, never the test.
- Never commit secrets, tokens, or machine-specific paths.
- Never write to production, or push directly to `main`, without a named human authorization.
- When the same mistake is made twice, put the correction under "Things agents get wrong" below in that same PR.
- Never end a session without updating `HANDOFF.md`.
- Never use `CHANGELOG.md` as a session transcript — one ISO-dated outcome per entry, ≤100 words, linked to a PR, issue, or ADR.

## Significant means (write an ADR)

- Introduces a new dependency or runtime.
- Changes how state is stored or shared.
- Alters a previously accepted design.
- Has security, privacy, or cost implications.
- Would surprise another agent picking up the project.

## Architecture

- `notekeep/cli.py` — argument parsing and command dispatch.
- `notekeep/store.py` — SQLite persistence (see ADR-0001).
- `notekeep/models.py` — the `Note` dataclass.
- Tests in `tests/`, one module per source module.

## Do not change

- Storage is SQLite via `store.py` (ADR-0001). Do not reintroduce the JSON-file store
  without a superseding ADR.

## Things agents get wrong

<!-- When an agent makes the same mistake twice, or review flags it twice, the correction goes here in that PR. -->

- Database access must go through `store.py` only. Do not open `sqlite3.connect` from
  `cli.py` or tests — flagged twice in review.
- Schema changes are additive forward migrations. Do not edit an existing migration in
  place; add a new one, or the fresh-db and upgrade paths diverge.

## Where things live

- Change chain (intent/spec/plan): `docs/changes/<slug>/`
- Decisions (ADRs): `docs/decisions/`
- Review policy: `REVIEW.md`
- Release log: `CHANGELOG.md` (run `node scripts/check-changelog.mjs CHANGELOG.md`)
- Handoff: `HANDOFF.md` · Test policy: `TESTING.md`
- Enforcement: `.github/workflows/ci.yml`, `.github/CODEOWNERS`, branch protection, `.claude/settings.json`, `.claude/hooks/`

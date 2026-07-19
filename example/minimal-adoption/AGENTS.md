# AGENTS.md

Universal, tool-agnostic project rules and the single source of truth. Loaded into
context every session by both harnesses (Pi natively; Claude Code via `CLAUDE.md`'s
`@AGENTS.md` import) and rebuilt from disk after compaction.

## Session start — do this every session and after every compaction

1. Read `HANDOFF.md` — priorities, blockers, where to resume.
2. Re-read the rules below.
3. Read the relevant `docs/decisions/` and `docs/prd/` for the task.
4. If scope is unclear, confirm with the human before acting.

## Project

`notekeep` is a small command-line note manager for a single user. It stores notes
locally and supports create, list, search, and (in progress) tagging.

## Commands

```bash
# Build / install (editable):   pip install -e .
# Test (the test gate runs):    pytest -q
# Lint / type-check:            ruff check . && mypy notekeep
# Run locally:                  notekeep --help
```

- **Default branch:** `main`

## Gates — a change may not merge until all pass

1. **Decision gate** — significant choice has an ADR in `docs/decisions/`, or is not needed.
2. **Spec gate** — non-trivial change has a PRD in `docs/prd/`, or is not needed.
3. **Test gate** — `pytest -q` passes; new behavior/bug fixes covered.
4. **Review gate** — PR opened with the template; context checklist complete.
5. **Handoff gate** — `CHANGELOG.md` (Unreleased) and `HANDOFF.md` updated.

## Hard rules

- Never implement a non-trivial feature without a PRD, or change a settled design without a superseding ADR.
- Never skip the test gate, and never claim verification that was not performed.
- Never commit secrets, tokens, or machine-specific paths.
- Never write to production systems, or push directly to `main`, without explicit human confirmation.
- Never end a session without updating `HANDOFF.md`.

## Architecture

- `notekeep/cli.py` — argument parsing and command dispatch.
- `notekeep/store.py` — SQLite persistence (see ADR-0001).
- `notekeep/models.py` — the `Note` dataclass.
- Tests in `tests/`, one module per source module.

## Do not change

- Storage is SQLite via `store.py` (ADR-0001). Do not reintroduce the JSON-file store
  without a superseding ADR.

## Where things live

- Decisions (ADRs): `docs/decisions/`
- Product requirements (PRDs): `docs/prd/`
- Release log: `CHANGELOG.md` · Handoff: `HANDOFF.md` · Test policy: `TESTING.md`
- Enforcement: `.github/workflows/ci.yml`, branch protection, `.claude/settings.json`

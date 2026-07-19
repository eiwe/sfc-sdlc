<!-- Living handoff document. Update at the end of every session. The next session reads this first. -->

# Handoff

**Last updated:** 2026-07-18
**Updated by:** Claude Code

## Current priorities

1. Finish the `notekeep tag` command (see `docs/prd/tagging.md`).
2. Add search-by-tag once tagging lands.

## Active workstreams

- **Tagging** — `models.Note` now has a `tags` field and the migration is done.
  Remaining: the `tag add/remove/list` subcommands in `cli.py` and their tests.
  Resume in `notekeep/cli.py` at the `# TODO: tag subcommand` marker.

## Blockers

- None.

## Recent decisions

- ADR-0001: storage is SQLite (accepted 2026-07-10).

## Known issues

- `search` is case-sensitive; acceptable for now, noted for a future PRD.

## How to resume

1. `pip install -e . && pytest -q` to confirm green.
2. Implement the `tag` subcommand against the acceptance criteria in `docs/prd/tagging.md`.

## Key references

- `docs/prd/tagging.md` — the feature being built.
- `docs/decisions/0001-use-sqlite-for-storage.md` — storage decision.

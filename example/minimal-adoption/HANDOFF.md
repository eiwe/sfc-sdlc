<!-- Living handoff document. Update at the end of every session. The next session reads this first. -->

# Handoff

**Last updated:** 2026-07-18
**Updated by:** Claude Code

## Current priorities

1. Finish the `notekeep tag` command (see `docs/changes/tagging/`: intent, spec, plan).
2. Add search-by-tag once tagging lands (needs its own intent).

## Active workstreams

- **Tagging** — plan approved (`docs/changes/tagging/plan.md`). `models.Note` now has a
  `tags` field and the `note_tags` migration is done. Remaining: the `tag add/remove/list`
  subcommands in `cli.py` and their tests (`tests/test_cli_tag.py`).
  Resume in `notekeep/cli.py` at the `# TODO: tag subcommand` marker.

## Blockers

- None.

## Recent decisions

- ADR-0001: storage is SQLite (accepted 2026-07-10).

## Known issues

- `search` is case-sensitive; acceptable for now, noted for a future change (its own intent).

## How to resume

1. `pip install -e . && pytest -q` to confirm green.
2. Implement the `tag` subcommand against `docs/changes/tagging/plan.md` and the
   acceptance criteria in `docs/changes/tagging/spec.md`.

## Key references

- `docs/changes/tagging/` — intent, spec, and plan for the feature being built.
- `docs/decisions/0001-use-sqlite-for-storage.md` — storage decision.

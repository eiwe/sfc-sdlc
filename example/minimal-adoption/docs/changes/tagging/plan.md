# Plan: Note tagging

**Status:** Approved
**Date:** 2026-07-15
**Approved by:** Eiwe
**Spec:** [docs/changes/tagging/spec.md](spec.md)

## Files that change

- `notekeep/models.py` — add a `tags: list[str]` field to the `Note` dataclass (default empty).
- `notekeep/store.py` — create the `note_tags` table in the migration; add
  `add_tags`, `remove_tags`, and `list_tags`.
- `notekeep/cli.py` — add the `tag` subcommand group (`add`, `remove`, `list`) at the
  `# TODO: tag subcommand` marker.
- `tests/test_cli_tag.py` — new tests for all three subcommands, including duplicate
  and unknown-tag cases.

## Order of work

1. Add the `note_tags` table to the migration in `store.py` and confirm it applies on a fresh db.
2. Implement `add_tags` / `remove_tags` / `list_tags` in `store.py`.
3. Add the `tags` field to `models.Note`.
4. Wire the `tag` subcommand group in `cli.py`.
5. Write `tests/test_cli_tag.py` and make it green.

## Risks

- **Riskiest step:** the migration. A wrong schema change could break the existing
  `notes` table. Mitigation: additive-only migration (new table), tested against a fresh db.
- **What could break:** the unique `(note_id, tag)` constraint must be handled so a
  duplicate add is a silent no-op, not an error surfaced to the user.
- **Option not taken:** storing tags as a comma-joined string on the `notes` row. Rejected
  because it cannot enforce uniqueness and makes future tag-filtering a string scan.

## Proof

- `pytest -q` green, including `tests/test_cli_tag.py`.
- Manual: `notekeep tag add 1 work work` then `notekeep tag list 1` prints `work` once;
  `notekeep tag remove 1 missing` exits 0 and changes nothing.
- Tags survive a process restart (covered by a test that reopens the store).

## Deviations

none

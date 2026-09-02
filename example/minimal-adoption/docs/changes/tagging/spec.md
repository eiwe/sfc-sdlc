# Spec: Note tagging

**Status:** Accepted
**Date:** 2026-07-15
**Owner:** Eiwe
**Intent:** [docs/changes/tagging/intent.md](intent.md)
**Decisions:** [ADR-0001](../../decisions/0001-use-sqlite-for-storage.md)

## Problem

Users accumulate many notes and cannot group them. They need lightweight labels to
organize and later filter notes.

## Goals

- Attach one or more free-text tags to a note.
- Add, remove, and list tags on a note from the CLI.

## Non-goals

- Tag renaming or merging.
- Tag hierarchies or colors.

## Users and user stories

- As a user, I want to tag a note so that I can group related notes.
- As a user, I want to list a note's tags so that I can see how it's organized.

## Requirements

1. Tags are free-text strings attached to an existing note by its id.
2. Adding a tag that already exists on the note is a no-op (no duplicates).
3. Removing a tag the note does not have is a no-op (no error).
4. Tags persist across restarts.

## Design

- **Data.** A new `note_tags(note_id INTEGER, tag TEXT)` table with a unique constraint
  on `(note_id, tag)`, so duplicates are rejected at the storage layer. `note_id` references
  the existing `notes` table. All access goes through `store.py` (ADR-0001).
- **Interfaces (`store.py`).** `add_tags(note_id, tags)`, `remove_tags(note_id, tags)`,
  `list_tags(note_id) -> list[str]` (sorted). `models.Note` gains a `tags: list[str]` field.
- **CLI.** A `tag` subcommand group in `cli.py`:
  - `notekeep tag add <note-id> <tag>...`
  - `notekeep tag remove <note-id> <tag>...`
  - `notekeep tag list <note-id>` (one tag per line, sorted).

## Acceptance criteria

- `notekeep tag add <note-id> <tag>...` adds tags; duplicates are ignored.
- `notekeep tag remove <note-id> <tag>...` removes tags; unknown tags are a no-op.
- `notekeep tag list <note-id>` prints the note's tags, one per line, sorted.
- Tags persist in SQLite and survive restart.
- All three subcommands have unit tests, including the duplicate and unknown-tag cases.

## Flagged concerns

None.

## Related decisions

- ADR-0001 (SQLite storage) — tags are stored in a `note_tags` table.

## Open questions

- Should tags be case-normalized? Deferred; treat as case-sensitive for now.
- Filtering `search`/`list` by tag is out of scope here; it will get its own intent once tagging lands.

# PRD: Note tagging

**Status:** Approved
**Date:** 2026-07-15
**Owner:** Eiwe

## Problem

Users accumulate many notes and cannot group them. They need lightweight labels to
organize and later filter notes.

## Goals

- Attach one or more free-text tags to a note.
- Add, remove, and list tags on a note from the CLI.

## Non-goals

- Tag renaming or merging.
- Tag hierarchies or colors.

## User stories

- As a user, I want to tag a note so that I can group related notes.
- As a user, I want to list a note's tags so that I can see how it's organized.

## Acceptance criteria

- `notekeep tag add <note-id> <tag>...` adds tags; duplicates are ignored.
- `notekeep tag remove <note-id> <tag>...` removes tags; unknown tags are a no-op.
- `notekeep tag list <note-id>` prints the note's tags, one per line, sorted.
- Tags persist in SQLite and survive restart.
- All three subcommands have unit tests, including the duplicate and unknown-tag cases.

## Out of scope

- Filtering `search`/`list` by tag (a follow-up PRD once tagging lands).

## Open questions

- Should tags be case-normalized? Deferred; treat as case-sensitive for now.

## Related decisions

- ADR-0001 (SQLite storage) — tags are stored in a `note_tags` table.

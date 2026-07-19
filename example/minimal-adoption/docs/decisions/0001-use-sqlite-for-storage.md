# ADR-0001: Use SQLite for storage

**Status:** Accepted
**Date:** 2026-07-10
**Type:** Architecture
**Owners:** Eiwe

## Context

`notekeep` started with a single JSON file for notes. As soon as search and tagging
appeared on the roadmap, the JSON store meant loading and rewriting the whole file
on every change, with no querying and a corruption risk on interrupted writes.

## Decision

Store notes in a local SQLite database (`~/.notekeep/notes.db`), accessed through
`notekeep/store.py`. Schema changes go through small forward migrations.

## Alternatives considered

- **Keep the JSON file** — simplest, but no querying and unsafe concurrent writes.
- **A hosted DB** — overkill for a single-user local CLI; adds setup and secrets.

## Consequences

- Querying (search, tag filters) is a SQL statement, not a full-file scan.
- A migration step is now mandatory for schema changes.
- `store.py` is the only module allowed to touch the database.

## AI guidance

When working in this area:
- Preserve the `store.py`-only database access boundary.
- Avoid reintroducing a file-based store without a superseding ADR.
- Ask for human review when changing the schema or migration logic.

## Links

- Supersedes: none.
- Related: `docs/prd/tagging.md`.

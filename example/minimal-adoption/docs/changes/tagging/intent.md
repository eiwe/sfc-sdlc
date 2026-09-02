# Intent: Note tagging

**Author:** Eiwe
**Status:** Accepted
**Date:** 2026-07-14
**Tracker:** none

## Problem

I've got hundreds of notes now and no way to group them. When I'm looking for
everything about one project, I have to remember the exact words I used and search
for them. I want to be able to slap a label or two on a note and pull them back up
later by that label.

## Proposed outcome

I can put one or more short tags on a note, take them off again, and see what tags a
note has — all from the command line, without leaving the tool.

## Affected users and systems

Me (the only user). The CLI (`cli.py`) and the SQLite store (`store.py`).

## Constraints

Tags live in the existing local SQLite database — no new storage, no network, no
extra dependencies.

## Open questions

- Should "Work" and "work" be the same tag? I don't care much yet; whatever is simpler.
- Do I need to filter notes by tag straight away, or can that come later? Later is fine.

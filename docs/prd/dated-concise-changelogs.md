# PRD: Dated, concise changelogs

- **Status:** Approved
- **Date:** 2026-07-29
- **Decision:** `docs/decisions/0001-dated-concise-changelog-contract.md`

## Problem statement

The SDLC requires a hand-maintained changelog but does not define a format that
remains readable under continuous AI-agent updates. Entries can lack dates,
repeat category headings, and expand into multi-thousand-word session reports.
The process provides no automated signal when this drift occurs.

## Goals

- Define one precise changelog entry format with dates and durable references.
- Separate release notes from PR verification, decisions, open work, and handoff
  state.
- Make newly adopted repositories start with the correct template.
- Add a dependency-free checker suitable for local use and CI.
- Resolve when changelog and handoff updates happen relative to merge.

## Non-goals

- Automatically judge whether prose is accurate or sufficiently user-focused.
- Generate release notes from commits or pull requests.
- Rewrite existing adopters automatically.
- Mandate semantic versioning for projects that use another release scheme.

## Acceptance criteria

- `docs/SDLC.md` documents the exact entry schema, content boundaries, and
  pre-merge handoff timing.
- `docs/GITHUB_WORKFLOW.md` makes dated changelog compliance part of review.
- The adoption skill copies a changelog checker to `scripts/` and the CI
  template runs it.
- The changelog and PR templates, AGENTS template, and minimal example use the
  new contract.
- The checker rejects duplicate categories, missing or invalid entry dates,
  entries over 100 words, lines over 120 characters, and entries with no durable
  reference.
- Automated tests cover valid and invalid examples without third-party packages.
- The repository's documented validation command passes.

## Out of scope

- Migrating a particular adopter's historical changelog. That belongs in a
  separate reviewed PR after this contract is accepted.
- Cutting or tagging a release of this package.

## Open questions

None. The project owner selected dated entries within unique Keep a Changelog
categories rather than date-grouped category blocks.

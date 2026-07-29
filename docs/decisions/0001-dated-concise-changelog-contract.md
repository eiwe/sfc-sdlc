# Decision: Dated, concise changelog entries with enforced boundaries

- **Status:** Accepted
- **Date:** 2026-07-29
- **Deciders:** Project owner and maintainers

## Context

The original changelog guidance says to append notable changes under an
`Unreleased` heading, but it does not define dates, entry size, category
uniqueness, or what information belongs elsewhere. In a continuously developed
project, agents can preserve every implementation detail by repeatedly adding
new `Added`, `Changed`, and `Fixed` headings. The result is complete but not
usable as a release log.

The process also says both that changelog and handoff work happens after merge
and that the handoff gate must pass before merge. Those instructions cannot both
be true.

## Decision

Adopt a strict changelog contract for the `Unreleased` section:

- Each allowed category appears at most once.
- Every entry begins with an ISO date: ``- `YYYY-MM-DD` ``.
- Entries are newest first within their category.
- One entry describes one logical outcome in no more than 100 words and three
  sentences.
- Every entry links to a pull request, issue, ADR, or equivalent durable record.
- Lines are wrapped at 120 characters or fewer.
- Open production defects may appear under `Known issues`; they must never be
  described as fixed before the fix lands.
- Root-cause narratives, command transcripts, deployment identifiers, and
  implementation tours belong in PRs, ADRs, issues, or the living handoff.

The changelog and anticipated handoff state are updated in the change PR before
merge. A reviewer corrects the date if necessary before approval. Release
headings retain the Keep a Changelog form `## [VERSION] - YYYY-MM-DD`.

The adoption package ships a dependency-free changelog checker, and its CI
template runs that checker before the project-specific test commands.

## Consequences

- Changelogs become scannable and chronologically attributable.
- Durable detail remains available, but in documents designed for that depth.
- Existing verbose changelogs need a reviewed migration. Their original text
  should be archived before it is compressed so unique context is not lost.
- Pull requests may need a small changelog edit after the PR number exists.
- The checker is intentionally narrow. It validates structure and size, not the
  editorial quality or truth of an entry.

## Alternatives considered

### Date-grouped subheadings

Grouping each day above another set of `Added` and `Fixed` headings preserves
chronology, but recreates the repeated-heading problem and drifts further from
Keep a Changelog.

### Release dates only

This works for frequent formal releases, but leaves long-running `Unreleased`
sections unattributed.

### Unrestricted narrative entries

This preserves maximum detail in one file, but makes the changelog duplicate
PRs, ADRs, issues, and handoffs and eventually defeats quick scanning.

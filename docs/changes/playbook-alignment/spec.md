# Spec: align the SDLC with Anthropic's AI-Native SDLC Playbook

- **Status:** Accepted
- **Date:** 2026-09-02
- **Owner:** project owner (Eiwe)
- **Intent:** [`intent.md`](intent.md)
- **Decisions:** ADR [`0002-align-with-ai-native-sdlc-playbook`](../../decisions/0002-align-with-ai-native-sdlc-playbook.md)

## Problem

The SDLC does not match the playbook's committed-artifact chain (`intent.md` → `spec.md` →
`plan.md` → diff and tests → PR with review findings → incident record) or its control model
(skills advise, hooks enforce, humans decide at gates, the agent acts up to the production gate).
See [`intent.md`](intent.md).

## Goals

- Restructure the methodology around the six stages and the seven gates, with proportionality for
  trivial changes.
- Replace `docs/prd/` with `docs/changes/<slug>/{intent,spec,plan}.md`.
- Add a review policy (`REVIEW.md`), a production boundary, and the feedback-loop rules.
- Ship the enforcement: new hooks, subagents, CODEOWNERS, and updated templates.
- Document the mapping honestly, including out-of-scope plays.

## Non-goals

- Building an eval suite, monitoring `bands.yaml`, MCP deploy tooling, or Anthropic-hosted
  capabilities (Claude Security, Claude Tag). These are documented as adopter-enabled.
- Migrating adopters' historical changelogs or PRDs automatically.
- Changing the changelog contract itself (kept verbatim) or bumping the version.

## Users and user stories

- As an **adopter**, I can read `PLAYBOOK_ALIGNMENT.md` and see exactly how each play is
  implemented and enforced here.
- As an **engineer**, I write no code before an approved committed `plan.md`, and my bug fix
  cannot weaken the test that proves it.
- As a **product owner**, I accept `intent.md` and `spec.md` at the gates without writing them.
- As a **Pi user**, I still get the same gates through `AGENTS.md`, `REVIEW.md`, and GitHub, even
  though the hooks and subagents are Claude Code-only.

## Requirements

- `docs/SDLC.md` states the eight principles, the artifact chain, session start, the six stages
  (each with what happens / artifacts / who decides / SFC specifics), the seven gates, the
  production boundary, the changelog contract verbatim, roles, hard rules, and measurable
  indicators — under ~300 lines.
- `docs/PLAYBOOK_ALIGNMENT.md` maps every play with columns Play / How implemented / Enforcement
  layer / Status, plus the "adds" and "narrows" sections.
- `docs/GITHUB_WORKFLOW.md` links the change folder, adds `require_code_owner_reviews=true`,
  documents CODEOWNERS, the `REVIEW.md` review process, optional AI review and the `@claude` loop,
  and an optional agent-evals workflow.
- `docs/COMPATIBILITY.md` reflects the new hooks/agents and what is Claude Code-only, and adds the
  playbook as a verified source.
- `README.md`, the manifests, ADR-0002, and the dogfooded change chain are updated.
- The payload gains `REVIEW.md`, `.github/CODEOWNERS`, `.claude/agents/{verifier,reviewer}.md`,
  `guard-production.mjs`, `guard-tests.mjs`, and intent/spec/plan templates; tests cover the
  guards. (Delivered by the concurrent payload work under `skills/adopt/**`, `tests/**`,
  `example/**`.)

## Design

- **Approach:** keep the two-layer model (distributable skill/plugin + installed durable layer);
  extend both to the playbook's chain and controls. Documentation and payload are split across two
  concurrent work streams to the same design.
- **Interfaces (hook env vars):** `SDLC_RELEASE_APPROVAL`, `SDLC_PRODUCTION_PATTERN`,
  `SDLC_PROTECT_TESTS`, `SDLC_ALLOW_TEST_EDIT`, `SDLC_TEST_PATTERN`, `SDLC_ALLOW_PUSH_MAIN`,
  `SDLC_PROTECTED_BRANCHES`.
- **Data / layout:** `docs/changes/<slug>/{intent,spec,plan}.md`; `docs/changes/_template/`;
  `REVIEW.md`; `.github/CODEOWNERS`; `.claude/agents/{verifier,reviewer}.md`;
  `.claude/hooks/{session-reminder,guard-push,guard-production,guard-tests}.mjs`;
  `scripts/check-changelog.mjs`.
- **UX:** docs stay plain, prescriptive, and tables-where-they-help; templates stay short with
  HTML-comment fill-in guidance.

## Acceptance criteria

- `docs/SDLC.md` is ≤ 300 lines and contains the eight principles, seven gates in order, the
  production boundary, the changelog contract verbatim, and the measuring-it indicators.
- `docs/PLAYBOOK_ALIGNMENT.md` has one row per play with an honest Status, and the adds/narrows
  sections.
- No file in scope refers to `docs/prd/` or "PRD" as a current artifact (historical mentions in
  ADR-0001 and the moved spec body are acceptable; ADR-0002 explains the rename).
- `docs/prd/dated-concise-changelogs.md` is moved to `docs/changes/dated-concise-changelogs/spec.md`
  with its H1 retitled and body intact; `docs/prd/` is removed.
- The manifests keep version 0.1.0 and add the `ai-native-sdlc` and `playbook` keywords.

## Flagged concerns

None. No brand, security, compliance, or UX policy conflicts arise; the change is to process
documentation and repo-local configuration.

## Related decisions

- ADR [`0002-align-with-ai-native-sdlc-playbook`](../../decisions/0002-align-with-ai-native-sdlc-playbook.md)
- ADR [`0001-dated-concise-changelog-contract`](../../decisions/0001-dated-concise-changelog-contract.md)
  (the changelog contract this change preserves verbatim)

## Open questions

None.
</content>

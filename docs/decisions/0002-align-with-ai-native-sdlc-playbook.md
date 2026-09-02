# Decision: Align the SDLC with Anthropic's AI-Native SDLC Playbook

- **Status:** Accepted
- **Date:** 2026-09-02
- **Type:** Product / Process
- **Deciders:** Project owner (Eiwe)

## Context

Anthropic published the [AI-Native SDLC Playbook](https://claude.com/blog/the-ai-native-sdlc-playbook)
on 2026-08-21: a six-stage loop (Plan → Design → Build → Test → Deploy → Maintain) built on a
committed-artifact chain (`intent.md` → `spec.md` → `plan.md` → diff and tests → PR with review
findings → incident record) and a control model where skills advise, hooks enforce, humans decide
at gates, and the agent acts up to the production gate and never past it.

This SDLC already shared much of that shape — `AGENTS.md` as durable context, ADRs, a test/review/
handoff gate chain — but it lacked several of the playbook's load-bearing pieces:

- No **intent** artifact (ideas went straight to a PRD) and no committed **plan** artifact (the
  implementation plan lived in the engineer's head or a ticket).
- No written **review policy**: review passes, Important-vs-Nit, and do-not-report rules were
  implicit.
- No **production gate** as an action boundary distinct from the merge gates.
- None of the playbook's **feedback-loop** rules: single-command verification, failing-test-first
  bug fixes, and protecting the test from the agent fixing the code.

## Decision

Adopt the playbook's vocabulary and stages as the methodology's spine, keeping this SDLC's
cross-harness additions on top:

- **Six stages** (Plan, Design, Build, Test, Deploy, Maintain) plus the session-start ritual, and
  **seven gates** in order — intent, decision, spec, plan, test, review, handoff — each with an
  explicit "not needed" for trivial changes. See [`../SDLC.md`](../SDLC.md).
- The **artifact chain** lives in `docs/changes/<slug>/` as `intent.md`, `spec.md`, `plan.md`,
  using the playbook's names literally. `docs/prd/` is retired: a PRD becomes the `spec.md` in a
  change folder.
- **`REVIEW.md`** at the repo root records the review policy, used by human reviewers, the
  `reviewer` subagent, and optional AI review.
- New Claude Code hooks — `guard-production.mjs` (the production boundary via
  `SDLC_RELEASE_APPROVAL`) and `guard-tests.mjs` (failing-test-first, via `SDLC_PROTECT_TESTS`) —
  join the existing `guard-push.mjs` and the session reminder.
- New `.claude/agents/` **subagents** (`verifier`, `reviewer`) and a **`.github/CODEOWNERS`** that
  routes agent-configuration files to code owners, with `require_code_owner_reviews=true` on the
  protected branch.

The play-by-play mapping, including what is out of scope, is in
[`../PLAYBOOK_ALIGNMENT.md`](../PLAYBOOK_ALIGNMENT.md).

## Consequences

- Existing adopters keep working: a `docs/prd/*.md` file is still a valid spec. Migrate it with
  `git mv` to `docs/changes/<slug>/spec.md` when the change is next touched (as done here for
  `dated-concise-changelogs`).
- Non-trivial changes now carry three small artifacts instead of one PRD; trivial changes record
  "not needed" per skipped gate, so the chain scales with the change.
- The Claude Code-only pieces (hooks, subagents) are clearly labeled; GitHub branch protection and
  CI remain the harness-independent enforcement, so Pi adopters are not left without a gate.
- More configuration ships in the payload (`REVIEW.md`, `CODEOWNERS`, two hooks, two subagents,
  three templates), which is regression-tested where practical (`tests/`).

## Alternatives considered

### Keep `docs/prd/` and add `docs/intent/` + `docs/plans/` side by side

Rejected: the chain for one change would split across three directory trees, and the
git-timestamp metrics (intent→spec elapsed time, spec-after-plan rework) would require joining
files across trees by naming convention.

### Adopt the playbook's `intent/` folder literally

Rejected: an `intent/` folder holds only the intent, leaving the spec and plan to live elsewhere.
A per-change folder keeps the triple together and makes the metrics trivial.

### Rename the phases to match the playbook without adding the artifacts

Rejected as cosmetic: the value is in the committed intent and plan and the review/production
controls, not in the stage labels.

## Links

- AI-Native SDLC Playbook — https://claude.com/blog/the-ai-native-sdlc-playbook (2026-08-21)
- [`docs/SDLC.md`](../SDLC.md)
- [`docs/PLAYBOOK_ALIGNMENT.md`](../PLAYBOOK_ALIGNMENT.md)
- [`docs/decisions/0001-dated-concise-changelog-contract.md`](0001-dated-concise-changelog-contract.md)
</content>

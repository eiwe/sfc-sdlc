# Spec-First Collaborative SDLC

A process for building software with AI agents. It is language-agnostic, tool-agnostic, and prescriptive about the order in which work happens.

## Principles

1. **Decisions before code.** Significant architecture, product, and design choices are recorded in decision documents before they are implemented.
2. **Requirements before implementation.** Non-trivial work starts with a PRD or spec that defines success.
3. **Context is durable.** Every agent must be able to pick up the project by reading a small set of files.
4. **Changes are traceable.** Every change flows through a branch, a PR, and the changelog.
5. **Quality is gated.** Code is verified by tests and by adversarial review before it is merged.
6. **Humans own production.** Agents implement, review, and document; humans approve writes to production systems and secrets.

## Required documents

- `AGENTS.md` — universal rules, read first on every session. This is the **source
  of truth**: both Claude Code and Pi load it into context each session and rebuild
  it from disk after context compaction, so the rules are always present.
- `CLAUDE.md` — a one-line `@AGENTS.md` import so Claude Code (which does not read
  `AGENTS.md` natively) loads the same rules.
- `HANDOFF.md` — living status document so the next session knows where to start.
- `CHANGELOG.md` — user-visible changes, hand-maintained.
- `docs/decisions/` — architecture/product/design decision records (ADRs).
- `docs/prd/` or `docs/specs/` — product requirements documents.
- `TESTING.md` — test policy and requirements.

See [`COMPATIBILITY.md`](COMPATIBILITY.md) for how this maps onto each harness.

## Phases

### 1. Understand (every session, and after every context compaction)

Before writing or changing anything, the agent reads:

1. `HANDOFF.md` — what was left unfinished, blockers, current priorities.
2. `AGENTS.md` — universal rules and constraints.
3. Relevant `docs/decisions/` — settled debates that affect the task.
4. Relevant PRD/spec — the requirement being implemented or changed.

### 2. Decide

If the task involves a significant architecture, product, or design choice, write or update an ADR first.

Significant means:
- Introduces a new dependency or runtime.
- Changes how state is stored or shared.
- Alters a previously accepted design.
- Has security, privacy, or cost implications.
- Would surprise another agent picking up the project.

Use the ADR template in `skills/spec-first-sdlc/templates/ADR.md` (installed as `docs/decisions/ADR-template.md`).

### 3. Specify

If the task is non-trivial, write or update a PRD before implementation.

A PRD must include:
- Problem statement
- Goals and non-goals
- Acceptance criteria
- Out-of-scope items
- Open questions

Use the PRD template in `skills/spec-first-sdlc/templates/PRD.md` (installed as `docs/prd/PRD-template.md`).

### 4. Implement

- Create a short-lived branch from the default branch.
- Use conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `security:`, `chore:`).
- Write tests for new behavior and for fixed bugs.
- Keep changes focused; one PR per logical change.

### 5. Verify

Before requesting review, the agent must:

- Run the test suite and ensure it passes.
- Run any static checks defined in the project (lint, type check, compile, etc.).
- Perform live/manual verification for the affected path if the project has a runtime component.
- Update any documents affected by the change.

### 6. Review

Every change is reviewed through a pull request. The PR description must use the project template and include:

- Summary of what and why.
- Verification steps actually performed.
- Context checklist completed (AGENTS/CLAUDE, ADRs, CHANGELOG).

Adversarial review is strongly encouraged: ask another agent or human to check for drift, missing tests, and unintended consequences.

### 7. Hand off

After merge, update:

- `CHANGELOG.md` under the Unreleased section.
- `HANDOFF.md` with the new state, next priorities, and any blockers.
- Any PRDs or ADRs that are now superseded or complete.

## Gates

A change may not be merged until it passes:

1. **Decision gate** — ADR written or not needed.
2. **Spec gate** — PRD written or not needed.
3. **Test gate** — test suite passes; new behavior is covered.
4. **Review gate** — PR approved and context checklist complete.
5. **Handoff gate** — CHANGELOG and HANDOFF updated.

## Roles

- **Human owner:** defines priorities, approves production writes, owns secrets, resolves disputes.
- **AI agents:** implement, review, document, and maintain context.
- **GitHub:** source of truth, review surface, and audit trail.

## What agents must never do

- Never commit secrets, tokens, or machine-specific paths.
- Never write to production systems without explicit human confirmation.
- Never silently rewrite previously accepted decisions without a superseding ADR.
- Never skip the test suite or claim verification that was not performed.
- Never leave a session without updating `HANDOFF.md`.

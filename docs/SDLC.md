# Spec-First Collaborative SDLC

A process for building software with AI agents. It is language-agnostic, tool-agnostic, and
prescriptive about the order in which work happens. It implements
Anthropic's AI-Native SDLC Playbook (Plan → Design → Build → Test → Deploy → Maintain); see
[`PLAYBOOK_ALIGNMENT.md`](PLAYBOOK_ALIGNMENT.md) for the play-by-play mapping.

## Principles

1. **Intent before spec, spec before plan, plan before code.** Decisions and requirements are
   written before implementation.
2. **Every stage ends by committing an artifact the next stage reads.** The chain of commits is
   the audit trail: who asked for what, what the agent produced, and who approved it.
3. **Context is durable.** An agent can pick up the project by reading a small set of files, and
   those files are reloaded every session.
4. **Proportionality.** The artifact chain scales with the change; trivial changes skip it
   explicitly, never silently.
5. **Skills and context files advise; hooks, CI, and branch protection enforce.** A policy that
   must always hold needs a deterministic layer behind it.
6. **The agent verifies its own work before a human sees it**, and the evidence comes from the
   toolchain (pasted output, CI check runs, screenshots).
7. **Humans decide at the gates:** intent, spec, plan, review, and release authorization. Agents
   do everything up to the production boundary and nothing past it.
8. **Configuration that steers agents is code.** `AGENTS.md`, `CLAUDE.md`, `REVIEW.md`, skills,
   hooks, and subagents are versioned, reviewed by code owners, and regression-tested when
   practical.

## Required documents and the artifact chain

The required documents. The chain for one non-trivial change lives together in
`docs/changes/<slug>/`:

```
AGENTS.md                     Universal rules, read first every session (source of truth)
CLAUDE.md                     One-line @AGENTS.md bridge for Claude Code
HANDOFF.md                    Living status for the next session
CHANGELOG.md                  ISO-dated, concise user-visible changes
TESTING.md                    Test policy and the verification feedback loop
REVIEW.md                     The review policy (passes, Important vs Nit, do-not-report)
docs/changes/<slug>/
  intent.md                   Plan stage: problem, outcome, constraints, open questions
  spec.md                     Design stage: requirements + design, acceptance criteria
  plan.md                     Build stage: files, order, risks, proof, deviations
docs/decisions/NNNN-*.md      Cross-cutting settled decisions (ADRs)
```

`<slug>` is short kebab-case. The three change files use the playbook's names literally.
An accepted `intent.md` triggers the spec, an accepted `spec.md` triggers the plan, an approved
`plan.md` triggers the code. A `spec.md` links the ADRs that constrain it.

See [`COMPATIBILITY.md`](COMPATIBILITY.md) for how these map onto each harness.

## Session start

Before writing or changing anything — every session, and after every context compaction — the
agent reads, in order:

1. `HANDOFF.md` — what was left unfinished, blockers, current priorities.
2. `AGENTS.md` — universal rules and constraints.
3. The active change's `docs/changes/<slug>/` — `intent.md`, `spec.md`, `plan.md`.
4. Relevant `docs/decisions/` — settled debates that affect the task.

## Stages

The six stages are a loop, not a line: a maintenance finding re-enters as a new `intent.md`.

### 1. Plan

- **What happens here:** the originator captures the idea in their own words — brainstormed with
  an agent — as `docs/changes/<slug>/intent.md`: problem, proposed outcome, affected users and
  systems, constraints, open questions. The originator corrects anything the agent misunderstood.
- **Artifacts committed:** `intent.md` (Status Draft → Accepted). Author and timestamp join the
  git record.
- **Who decides:** the product owner accepts the intent into Design (the merge/approval of the PR
  that adds it, or a note in the file) or closes it.
- **SFC specifics:** one system is the source of truth per artifact. When a tracker (Jira,
  ServiceNow) already holds the record, `intent.md` links it and records the ID; otherwise the
  repo is the source of truth. Repeat processes are encoded as skills.

### 2. Design

- **What happens here:** from the accepted intent, an agent produces the requirements-and-design
  `spec.md`, guided by the org's brand/security/compliance/UX policies. The product owner reviews
  it, does not write it. Flagged concerns (contradicting policies) are worked first.
- **Artifacts committed:** `spec.md` alongside `intent.md`; ADRs for any significant decision.
- **Who decides:** the product owner accepts the spec with all flagged concerns resolved by their
  named policy owners, consulting a technical lead for higher-risk changes.
- **SFC specifics:** encode org policy as skills so it is applied while the spec is written, not
  discovered in review weeks later. A decision that meets the "significant" test gets its own ADR;
  the spec lists the ADRs that constrain it.

### 3. Build

- **What happens here:** no code is written before an approved plan. The engineer produces
  `plan.md` (in Claude Code, plan mode; tool-agnostic rule: no edits before an approved committed
  plan): files that change, order of work, risks (what could break, riskiest step, options not
  taken), proof (tests/checks/screenshots). Then the agent implements — often a single pass.
- **Artifacts committed:** `plan.md` (Status Proposed → Approved), then the diff and its tests.
  When implementation departs from the plan, `plan.md` is updated in the same commit under
  Deviations.
- **Who decides:** the engineer approves routine plans; a tech lead/architect approves higher-risk
  ones.
- **SFC specifics:** `AGENTS.md` is institutional knowledge — conventions, commands, architecture,
  and a "Things agents get wrong" section. When the same mistake is made twice, the correction
  goes into `AGENTS.md` in that same PR. Skills carry policy; hooks are build-time guardrails
  (block protected paths, keep secrets out of the diff). Parallel work runs in separate git
  worktrees; recurring jobs become subagents (`.claude/agents/`, Claude Code only).

### 4. Test

- **What happens here:** the session verifies its own work before a human sees it. A single
  command runs the tests and the build and exits non-zero on failure. For bug fixes, the failing
  test is written and committed first; then the code is fixed, never the test. UI work closes the
  loop with a screenshot/visual check.
- **Artifacts committed:** the tests, and the pasted verification output in the PR.
- **Who decides:** the code owner reviewing the PR, who can focus on intent and risk because the
  mechanical evidence is attached.
- **SFC specifics:** `AGENTS.md` lists each command with an example of healthy output and a
  quantifiable target so the agent can check itself. Launch a bug-fix session with
  `SDLC_PROTECT_TESTS=1` in its environment so `guard-tests.mjs` blocks edits to test files (see
  `TESTING.md`). Verification is part of "done."
  When `AGENTS.md` or `.claude/**` change, an optional eval suite can regression-test the agent's
  configuration in CI.

### 5. Deploy

- **What happens here:** the PR runs the `REVIEW.md` passes (bugs; security; compliance against
  `spec.md`, `plan.md`, ADRs, and `AGENTS.md`). Optional AI review (Claude Code Code Review or
  `claude-code-action`) and the `@claude` fix loop assist; findings do not approve or block on
  their own. A human code owner approves through branch protection. Review findings feed back into
  `AGENTS.md`.
- **Artifacts committed:** the PR with its review findings and resolutions; the changelog and
  handoff entries.
- **Who decides:** a human code owner approves the merge; a named human authorizes any production
  release.
- **SFC specifics:** hooks act as approval gates. The agent acts up to the production boundary and
  never past it: `guard-production.mjs` blocks a production deploy/write unless
  `SDLC_RELEASE_APPROVAL` names the approver or ticket, and branch protection means agent output
  always arrives as a PR. Autonomy is tiered by environment (free in dev, human-authorized in
  prod). Rollback is a rehearsed single command. CI/CD judgment steps may run `claude -p`
  (adopter enables).

### 6. Maintain

- **What happens here:** the loop closes. An incident, a scheduled scan finding, or a breached
  monitoring band is diagnosed and written back as a new `intent.md` in the Plan format, then goes
  through the stages like anything else.
- **Artifacts committed:** the incident record and post-mortem; a new `intent.md`; a regression
  test for every fixed incident (and an eval if the project runs evals).
- **Who decides:** the service owner / on-call triages the queue (fix now, schedule, dismiss);
  resulting changes go through the normal review and release gates.
- **SFC specifics:** detection stays deterministic (a version-controlled, unit-tested script; no
  model in the detection path). Post-mortems are committed. Scheduled scans and on-call channels
  (Claude Security, Claude Tag) are adopter-enabled; see [`PLAYBOOK_ALIGNMENT.md`](PLAYBOOK_ALIGNMENT.md).

## Proportionality

A **trivial change** is one a reviewer can judge completely from the diff alone — a typo, a config
value, a docs-only fix, or a one-line bug fix that ships with its regression test. Trivial changes
skip intent/spec/plan; the PR records "not needed" for each skipped gate. Everything else is
non-trivial and takes the full chain.

A **significant decision** (needs an ADR) introduces a new dependency or runtime; changes how state
is stored or shared; alters a previously accepted design; has security, privacy, or cost
implications; or would surprise another agent picking up the project.

## Gates

A change may not merge until all seven pass, in this order:

1. **Intent gate** — `docs/changes/<slug>/intent.md` accepted by the product owner (or a linked
   tracker record that plays that role), or explicitly not needed (trivial).
2. **Decision gate** — every significant decision has an ADR in `docs/decisions/`, or explicitly
   not needed.
3. **Spec gate** — `spec.md` accepted by the owner with all flagged concerns resolved, or
   explicitly not needed (trivial).
4. **Plan gate** — `plan.md` approved by the engineer (tech lead/architect for higher-risk
   changes) before implementation started; the merged diff matches it or `plan.md` records the
   deviation.
5. **Test gate** — the test suite passes in CI; new behavior and fixed bugs are covered;
   verification output is in the PR.
6. **Review gate** — the PR uses the template; the `REVIEW.md` passes were run (human and/or AI)
   and Important findings resolved; a human code owner approved.
7. **Handoff gate** — a dated, concise `CHANGELOG.md` entry and the anticipated post-merge
   `HANDOFF.md` state are in the PR.

## Production boundary

Not a merge gate but an action boundary: the agent may act up to the production gate and never past
it. Any production write or deploy needs a named human authorization. Enforced by the
`guard-production.mjs` hook (`SDLC_RELEASE_APPROVAL=<approver or ticket>` is the authorization) and
by branch protection (agent output always arrives as a PR).

## Changelog contract

`CHANGELOG.md` is a release index, not a session transcript. Its job is to let a
reader quickly determine what changed, when it changed, and where the durable
detail lives.

Use one heading for each category under `Unreleased`. Allowed categories are
`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, and
`Known issues`. Omit unused headings if the project prefers, but never repeat a
category.

Every Unreleased entry uses this shape:

```markdown
- `YYYY-MM-DD` **Short outcome.** User-visible effect and one essential constraint.
  ([PR #123](https://github.com/OWNER/REPO/pull/123))
```

Rules:

- Use a valid ISO date and sort entries newest first within the category.
- Describe one logical outcome in no more than 100 words and three sentences.
- Wrap lines at 120 characters or fewer.
- Link a PR, issue, ADR, or equivalent durable record.
- Put root-cause analysis and exact verification in the PR; settled tradeoffs in
  ADRs; current priorities and blockers in `HANDOFF.md`; unresolved work in
  issues.
- A production defect may be listed under `Known issues`, but it cannot appear
  under `Fixed` until the fix lands.
- On release, use `## [VERSION] - YYYY-MM-DD`; the release heading supplies the
  date for entries moved out of `Unreleased`.

Adopted projects run `node scripts/check-changelog.mjs CHANGELOG.md`. The checker
enforces the mechanical contract; reviewers remain responsible for clarity and
truth.

## Roles

- **Product owner:** accepts intent and spec, resolves flagged concerns with policy owners.
- **Engineer / tech lead:** approves plans, implements, verifies; higher-risk plans go to a tech
  lead or architect.
- **Human code owner:** approves the merge through branch protection; a named human authorizes any
  production release.
- **AI agents:** brainstorm intent, draft specs and plans, implement, verify, review, and maintain
  context — up to the production boundary, never past it.
- **GitHub:** source of truth, review surface, and audit trail.

## What agents must never do

- Never implement a non-trivial change without an accepted `intent.md`, `spec.md`, and approved
  `plan.md`; never change a settled design without a superseding ADR.
- Never start editing code before the plan is approved; when the implementation departs from
  `plan.md`, update `plan.md` in the same commit.
- Never skip the test gate, never claim verification that was not performed, and always paste the
  verification output.
- When fixing a bug, write the failing test first and commit it; then fix the code, never the test.
- Never commit secrets, tokens, or machine-specific paths.
- Never deploy to or write to production, or push directly to the default branch, without a named
  human authorization.
- When the same mistake is made twice, put the correction in `AGENTS.md` under "Things agents get
  wrong" in that same PR.
- Never end a session without updating `HANDOFF.md`.
- Never use `CHANGELOG.md` as a session transcript (one ISO-dated outcome per entry, ≤100 words,
  durable reference).

## Measuring it

Leading and lagging indicators, each readable from git or PR metadata:

- **Intent→spec elapsed time** — the gap between the `intent.md` commit and the `spec.md` commit
  for the same change (two git timestamps).
- **Requirements rework** — count of `spec.md` commits dated after the first `plan.md` commit for
  the same change; from `git log`.
- **First-pass merge rate** — share of changes that merge from the first implementation pass, from
  PR metadata.
- **Diff-matches-plan rate** — how often the merged diff still matches the committed `plan.md`.
- **Time to first review** — from PR-opened to first review, from PR metadata.
- **First-pass CI success rate** — share of agent-written changes whose CI passes on the first run.
- **Repeated mistakes** — how often a mistake that `AGENTS.md` should have caught recurs, from the
  git history of `AGENTS.md` against review findings.
</content>
</invoke>

# Alignment with Anthropic's AI-Native SDLC Playbook

This SDLC is a tool-agnostic implementation of Anthropic's
[AI-Native SDLC Playbook](https://claude.com/blog/the-ai-native-sdlc-playbook) (Louis Claxton,
Anthropic Applied AI; published 2026-08-21). The playbook groups its plays into six non-linear
stages — Plan, Design, Build, Test, Deploy, Maintain — around one idea: each stage ends by
committing an artifact the next stage reads, and the chain of commits is the audit trail.

The table below maps each play to how this SDLC implements it, the layer that enforces it, and its
status. **Enforcement layer** is one of: *advisory* (an auto-loaded context file, template, or
skill), *deterministic* (a hook, CI check, or the changelog checker), or *platform* (GitHub branch
protection / CODEOWNERS). **Status** is *Shipped* (the `/sdlc:adopt` payload installs it),
*Documented, adopter enables* (this SDLC describes and points at it, but it needs infrastructure or
policy the adopter provides), or *Out of scope* (an Anthropic-hosted or managed-settings capability
this tool-agnostic repo does not ship).

## Plan

| Play | How this SDLC implements it | Enforcement layer | Status |
| --- | --- | --- | --- |
| Capture as intent.md | `docs/changes/<slug>/intent.md` from the `INTENT.md` template, in the originator's own words; product owner acceptance is the PR merge/approval or a note in the file | Advisory (template + `AGENTS.md`); platform (git history records author/timestamp) | Shipped |

## Design

| Play | How this SDLC implements it | Enforcement layer | Status |
| --- | --- | --- | --- |
| Requirements and design | `spec.md` from the `SPEC.md` template (requirements + design, acceptance criteria, flagged concerns with named policy owners); significant decisions become ADRs the spec links | Advisory (template, spec gate) | Shipped. Org brand/security/compliance/UX **skills** that constrain the spec are adopter-authored ([skills](https://code.claude.com/docs/en/skills)) |

## Build

| Play | How this SDLC implements it | Enforcement layer | Status |
| --- | --- | --- | --- |
| Plan mode as the default starting point | `plan.md` from the `PLAN.md` template (files, order, risks, proof, deviations); the tool-agnostic rule is **no edits before an approved committed `plan.md`** (plan gate) | Advisory (`AGENTS.md`/`SDLC.md` rule) | Shipped. Plan mode's own edit-lock is Claude Code-specific; this SDLC states the tool-agnostic rule instead |
| Auto mode | Guardrails that make auto-accept safe: a tuned `AGENTS.md`, policy skills, the test hooks, and CI | Claude Code setting | Documented, adopter enables ([settings](https://code.claude.com/docs/en/settings)) |
| Legacy systems and the source of truth | `intent.md` `Tracker` field and `spec.md` `Decisions` links; `SDLC.md` Plan stage names one source of truth per artifact (repo, legacy system, or linkage) | Advisory | Documented, adopter enables (MCP connector to Jira/ServiceNow: [managed MCP](https://code.claude.com/docs/en/managed-mcp)) |
| The CLAUDE.md | `AGENTS.md` is the institutional-knowledge file (auto-loaded every session; `CLAUDE.md` bridges it for Claude Code), with a "Things agents get wrong" section and the twice rule | Advisory (auto-loaded context); platform (CODEOWNERS reviews changes) | Shipped |
| Skills as institutional knowledge | This SDLC ships as a `SKILL.md` skill; adopters add policy skills under `.claude/skills/` for knowledge that must apply consistently | Advisory | Shipped (skill mechanism); policy skills adopter-authored ([skills](https://code.claude.com/docs/en/skills)) |
| Hooks as build-time guardrails | `guard-tests.mjs` (blocks test-file edits during a fix) and `guard-push.mjs` (blocks pushes to protected branches); adopters add path guards for frozen/generated code | Deterministic (Claude Code hook) | Shipped ([hooks](https://code.claude.com/docs/en/hooks-guide)) |
| Parallel sessions and subagents | `.claude/agents/verifier.md` and `reviewer.md`; worktree-per-task guidance in `SDLC.md` | Advisory (subagents are repo config) | Shipped (subagents, Claude Code only; Pi runs a second session/worktree) |

## Test

| Play | How this SDLC implements it | Enforcement layer | Status |
| --- | --- | --- | --- |
| Give Claude a feedback loop | `TESTING.md` mandates a single-command test/build; `AGENTS.md` lists healthy output and a quantifiable target; failing-test-first bug fixes with `SDLC_PROTECT_TESTS=1` backed by `guard-tests.mjs`; the `verifier` subagent packages the final check | Deterministic (hook); advisory (`TESTING.md`, `AGENTS.md`) | Shipped |
| Continuous evals in CI | Optional `agent-evals` workflow on `paths: ['AGENTS.md','CLAUDE.md','REVIEW.md','.claude/**']` regression-tests the agent's configuration | Deterministic (CI) | Documented, adopter enables (no eval suite ships; the playbook's `agent-evals.yml` is the shape) |

## Deploy

| Play | How this SDLC implements it | Enforcement layer | Status |
| --- | --- | --- | --- |
| AI in the PR review loop | `REVIEW.md` review policy (passes; Important vs Nit; nit cap; do-not-report; `fix/*` test-edit rule) applied by human reviewers and the `reviewer` subagent; a human code owner approves | Advisory (`REVIEW.md`, subagent); platform (branch protection + CODEOWNERS) | Shipped. Managed Code Review or `claude-code-action` and the `@claude` fix loop are adopter-enabled; findings never approve or block on their own |
| Hooks as approval gates | `guard-production.mjs` blocks a production deploy/write unless `SDLC_RELEASE_APPROVAL` names the approver or ticket | Deterministic (hook); platform (branch protection) | Shipped |
| Managed settings for a regulated enterprise | Not shipped — MDM/admin-console permission denies, sandbox profiles, managed-hooks-only, marketplace pinning | Platform / managed settings | Out of scope, adopter enables ([settings](https://code.claude.com/docs/en/settings), [server-managed settings](https://code.claude.com/docs/en/server-managed-settings), [sandboxing](https://code.claude.com/docs/en/sandboxing), [permissions](https://code.claude.com/docs/en/permissions)) |
| CI/CD integration and deployment | `ci.yml` runs the `verify` and `secret-scan` jobs; the production boundary and branch protection mean agent output always arrives as a PR; tiered autonomy and a rehearsed one-command rollback are documented | Deterministic (CI); platform | Shipped (CI + boundary). `claude -p` judgment steps and MCP deploy/rollback tooling are adopter-enabled ([managed MCP](https://code.claude.com/docs/en/managed-mcp), [enterprise deployment](https://code.claude.com/docs/en/third-party-integrations)) |

## Maintain

| Play | How this SDLC implements it | Enforcement layer | Status |
| --- | --- | --- | --- |
| Closing the loop | `SDLC.md` Maintain stage: an incident, scan finding, or breached monitoring band re-enters as a new `intent.md`; every fixed incident adds a regression test; detection stays deterministic | Advisory (process); adopter's detection script is deterministic | Documented, adopter enables (the playbook's `bands.yaml` tiers and detection script are adopter-written) |
| Recurring codebase scans | Not shipped — Claude Security scheduled scanning validates findings and routes them through the PR gate | Platform (Anthropic-hosted) | Out of scope, adopter enables (Claude Security, public beta; see the playbook and [security model](https://code.claude.com/docs/en/security)) |
| Claude on call with Claude Tag | Not shipped — Claude Tag makes Claude a member of incident channels; bounded fixes arrive as PRs, larger findings as `intent.md` | Platform (Anthropic-hosted) | Out of scope, adopter enables (Claude Tag, public beta in Slack; see the playbook) |

The playbook's own rollout order and every managed-only setting are documented in its Resources
section (the `code.claude.com/docs/en/...` and `platform.claude.com/docs/en/manage-claude/...`
links above, plus [monitoring](https://code.claude.com/docs/en/monitoring-usage),
[plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), and the
[compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api)).

## Where this SDLC deliberately adds to the playbook

- **`AGENTS.md` + `CLAUDE.md` bridge for the Pi harness.** The playbook's institutional-knowledge
  file is `CLAUDE.md`. This SDLC keeps the durable rules in `AGENTS.md` (the cross-harness
  standard both Claude Code and Pi read) and makes `CLAUDE.md` a one-line `@AGENTS.md` import, so a
  single source of truth governs both harnesses.
- **ADRs.** `docs/decisions/NNNN-*.md` record cross-cutting settled decisions; a `spec.md` links
  the ADRs that constrain it. The playbook keeps decisions inside the spec; ADRs give the
  significant ones a durable, independently referenceable home.
- **`HANDOFF.md` and the handoff gate.** A living status file the next session reads first, updated
  before every merge — durable context for long-running, multi-session agent work.
- **The dated changelog contract.** A precise `CHANGELOG.md` entry format (ISO-dated, ≤100 words,
  durable reference) with a dependency-free checker, so the release log stays scannable under
  continuous agent updates.
- **`docs/changes/<slug>/` as the home for the chain.** The playbook suggests an `intent/` folder;
  a per-change folder keeps the intent/spec/plan triple together and makes the git-timestamp
  metrics (intent→spec elapsed time, spec-after-plan rework) trivial to read.

## Where it deliberately narrows

- **Plan mode is Claude Code-specific.** Its edit-lock (Claude cannot change files until the plan
  is accepted) is a harness feature, not a portable one. This SDLC states the tool-agnostic rule
  instead: **no edits before an approved committed `plan.md`**, enforced by the plan gate and
  review rather than by the editor.
</content>

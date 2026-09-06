# Spec-First Collaborative SDLC

SFC is a portable artifact contract and a small execution controller for autonomous
development teams. It preserves the AI-Native SDLC playbook's committed artifacts,
independent confidence gates, review evidence and production boundary. Routine
approval can be delegated under explicit operator policy; see
[playbook alignment](PLAYBOOK_ALIGNMENT.md) and [ADR-0003](decisions/0003-autonomous-portable-sdlc.md).

## The contract

Intent precedes spec, spec precedes plan, and an accepted plan precedes
implementation. Each stage leaves committed evidence that the next stage reads.
An independent reviewer accepts planning artifacts. After implementation, a
deterministic command, separate verifier and reviewer evaluate the final revision.
Failures return to the producing role within budget; named escalation conditions
request the smallest missing decision.

Authorization belongs to a bounded task and policy, not a chat session. Starting a
new harness, changing models or compacting context does not remove valid approval.
Roles may have different personas, but permissions and acceptance criteria stay
the same. The implementation agent cannot supply its own independent approval.

## Durable documents

| Artifact | Purpose |
| --- | --- |
| `AGENTS.md` and `CLAUDE.md` import bridge | Short project rules, commands and settled constraints |
| `docs/changes/<slug>/intent.md` | Originator's problem, outcome, scope and authority |
| `spec.md` in the same folder | Testable requirements, design and flagged concerns |
| `plan.md` in the same folder | Files, ownership, order, risks and verification |
| `docs/decisions/NNNN-*.md` | Significant decisions with an independent lifetime |
| `ROLES.md`, `REVIEW.md`, `TESTING.md` | Shared role, review and verification procedures |
| `WORKFLOW.md` | Controller protocol, operation, recovery and trust boundary |
| `HANDOFF.md` | Current durable project status and how to resume |
| `CHANGELOG.md` | Dated, concise user-visible outcomes |
| Operator-controlled run record and PR | Revision-bound decisions, tool output and integration evidence |

One artifact has one authoritative home. If a tracker owns requirements or approval,
link its record and relevant revision instead of creating conflicting copies.
Agent-written status labels are navigation aids, not authenticated decisions.

Read the handoff, standing rules, active change and relevant ADRs at session start
and after compaction. Read controller status when resuming a run. Investigation and
read-only review do not require planning artifacts or new handoff/changelog writes.

## Stages and gates

| Stage | Producer and output | Independent gate |
| --- | --- | --- |
| Plan | Planner captures the accepted task as committed intent | Reviewer tests scope, outcome and authority |
| Design | Planner produces spec and significant ADRs | Reviewer tests requirements, policy and flagged decisions |
| Build planning | Planner writes the implementation plan | Reviewer tests ownership, risk and observable proof |
| Build | Implementer submits code, tests, changelog and handoff; controller commits | Scope and frozen-input checks |
| Test | Deterministic toolchain plus independent verifier | Actual command success and acceptance evidence on the submission |
| Review / integration | Reviewer applies correctness, security and compliance passes | Accepted final revision; trusted platform checks for optional merge |
| Maintain | Detection/incident produces a new intent and regression case | The same bounded workflow and release boundaries |

The seven logical gates remain intent, decision, spec, plan, test, review and
handoff. Decision review occurs with the spec; handoff content is completed during
build and checked in final review. The controller does not equate file presence
with quality: reviewers judge the requirements, ADR need, handoff and evidence.

For bug fixes, configure `taskKind: "fix"` and literal `testPaths` in the trusted
policy. After the plan gate, the implementer submits only regression tests; the
controller commits them, and the
verification command must fail normally; the reviewer checks that the failure
proves the intended bug. The controller freezes the regression baseline through
implementation. Missing commands, crashes and timeouts are not failing-test proof.
Manual workflows preserve the same sequence using committed failure evidence and
an independent Git diff review. See [TESTING.md](../skills/adopt/templates/TESTING.md).

A significant decision introduces a dependency/runtime, changes shared state or
authority, supersedes an accepted design, or has material security/privacy/cost
implications. Record it in an ADR before implementing it. Reopen accepted design
through a new reviewed change/run; never silently rewrite frozen inputs.

## Proportionality and autonomy

Keep artifacts brief and avoid repeated problem statements. Routine tasks use
the same roles with small invocations. An externally coordinated team may split
independent tasks into worktrees with clear write ownership; the controller itself
runs its role gates sequentially. Final proof evaluates the combined submission.

A manually managed trivial change may skip intent/spec/plan when a reviewer can
judge it entirely from the diff and the PR records each exemption. Security,
authority and production changes are not trivial merely because their diffs are
small. Controller runs always use the short three-artifact chain.

Resolve ordinary uncertainty by investigation and ordinary test/review failures
by repair. Escalate material product decisions outside intent, authority expansion,
destructive operations, production actions, protected-control changes not already
authorized, unavailable required verification, and exhausted budgets. Record
existing bounded authorization so control-development tasks do not repeatedly
ask for the same approval.

## What enforces what

Standing documents guide agents. Local hooks provide immediate feedback for
recognized tool operations. They do not cover all shell syntax or infer production
from credentials. Model statements cannot prove command results.

The controller owns invocations, transitions, output capture, revision checks,
budgets and run state. It rejects stale/invalid evidence and prevents a worker
from supplying an approval through a separate declaration API. Local same-user
operation is cooperative. Moving state outside the checkout is not a security
boundary. For authoritative use, host permissions protect the runtime, policy,
state, reviewer execution and integration identity from workers and tests.

The deployment platform controls production credentials and release approval.
GitHub required checks and the trusted integration route control merge. See
[GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md) and the installed
[WORKFLOW.md](../skills/adopt/templates/WORKFLOW.md). This repo does not provision
credentials, a sandbox, a scheduler or live GitHub protection.

## Changelog contract

`CHANGELOG.md` is a release index. Under `Unreleased`, use at most one heading each
for `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, and
`Known issues`. Omit unused headings.

```markdown
- `YYYY-MM-DD` **Short outcome.** User-visible effect and one essential constraint.
  ([PR #123](https://github.com/OWNER/REPO/pull/123))
```

Use a valid ISO date, newest first within each category, at most 100 words and
three sentences per entry, and lines at most 120 characters. Link a PR, issue, ADR
or equivalent durable record. A known production defect is not Fixed until the
fix lands. On release, use `## [VERSION] - YYYY-MM-DD`; that heading supplies the
date for moved entries. The dependency-free checker enforces format; reviewers
remain responsible for truth and clarity.

Keep root-cause analysis and verification in the PR/run evidence, settled decisions
in ADRs, and current priorities in HANDOFF.md. Complete those updates before final
verification/review rather than invalidating an accepted revision afterward.

## Maintaining the method

Treat agent configuration and SDLC controls as code. Significant policy changes
need an ADR and an explicitly authorized review path. When the same mistake occurs
twice, add a concise correction to AGENTS.md within an authorized change.

Measure elapsed stage time, revision attempts, escalation causes and defects from
retained run/PR evidence. Preserve stage commits when Git timestamps supply the
audit trail; squash merging otherwise loses those transitions. Maintain provider
cost limits in provider/host configuration. Evaluate the actual workflow with
adoption, resume, cross-harness handoff, regression and escalation scenarios; tests
of helpers alone cannot establish autonomous behavior.

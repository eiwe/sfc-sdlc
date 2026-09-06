# Playbook alignment

SFC follows the [AI-Native SDLC playbook](https://claude.com/blog/the-ai-native-sdlc-playbook)
by retaining committed stage artifacts, independent gates, review evidence and a
controlled production boundary. The source was checked on 2026-09-05.

The playbook's maintenance section describes headless stage progression through
deterministic checks or adversarial reviewers. Its earlier design and deployment
examples still require human decisions. SFC makes delegated routine approval an
explicit operator policy, while retaining accountable ownership and human
production authorization. This is a documented extension, not a claim that every
human approval example has been reproduced literally.

## Shipped implementation

| Control objective | SFC implementation | Practical boundary |
| --- | --- | --- |
| Durable work handoffs | Committed intent/spec/plan and revision-bound run/PR evidence | Artifact quality needs independent judgment |
| Institutional knowledge | Short AGENTS.md, CLAUDE.md import, role/review/testing procedures | Loaded instructions remain guidance |
| Approval before implementation | Controller planning stages and independent review gates | Authoritative deployment needs worker isolation |
| Continuous feedback | Actual verification command, separate verifier and bounded repair | A green suite only proves the checks it performs |
| Regression proof | Fix-mode failing-test stage, review and frozen test baseline | Reviewer establishes the intended failure |
| Consistent review | Correctness, security and compliance passes on the submitted revision | Distinct models/IDs do not prove competence |
| Action guardrails | Shared checks behind four thin harness adapters | Recognized tools and command forms only |
| Governed integration | Optional trusted integration command and documented platform setup | Platform rules/credentials are adopter-controlled |
| Maintenance loop | New incident/task intent enters the same workflow | Monitoring, triggers and production runbooks are adopter-owned |

The dependency-free controller captures invocations, output, decisions, revisions,
digests and budgets. It advances only through its configured gates. Its local
cooperative mode demonstrates workflow semantics; host permissions must protect
runtime, policy, state, evidence and integration credentials for authoritative use.

## Deliberate additions and limits

SFC adds four-harness discovery, the shared AGENTS.md bridge, independently durable
ADRs, HANDOFF.md, a concise dated changelog contract, deterministic adoption with
preservation checks, and a small runner protocol. Model/persona selection belongs
in operator configuration. The controller's gates are sequential; independent
implementation worktrees may be coordinated externally.

The package does not install a sandbox, provision credentials, create a scheduler
or change live branch protection. It does not ship managed enterprise settings,
hosted scanning/on-call services, or production access. Local command matching is
not presented as a production security boundary.

Keep changes proportional: the three controller artifacts may each be a few
lines, and unchanged project context is referenced rather than repeated. Preserve
the stage history or an equivalent retained audit record. Workflow tests cover
normal completion, repair, stale evidence, interruption, adoption and escalation;
live harness/provider behavior requires separate recorded runs.

[SDLC.md](SDLC.md) defines the method, [COMPATIBILITY.md](COMPATIBILITY.md) describes
the adapters and validation tiers, and [GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md)
describes platform integration. [ADR-0003](decisions/0003-autonomous-portable-sdlc.md)
supersedes unconditional routine human approval from ADR-0002 while retaining the
artifact and production-boundary decisions.

# Team roles

Assign roles for the task; personas tune expertise and communication, not authority.
Models and harnesses are operator-configured. A small change needs short role runs,
not a permanently running team. Share the committed artifacts and findings; keep
reviewer context independent of the implementer's conversation.

| Role | Work | Gate boundary |
| --- | --- | --- |
| Coordinator | Scope work, select configured runners, track dependencies and budgets | Cannot fabricate independent approval or widen policy |
| Planner / architect | Produce intent, spec, plan and significant ADRs; resolve in-scope questions | An independent reviewer accepts each artifact |
| Implementer | Build the approved scope, tests, changelog and handoff; address findings | Cannot approve its own submission |
| Verifier | Exercise acceptance criteria and neighboring behavior; report actual evidence | Does not repair the submission or invent deterministic results |
| Reviewer | Challenge planning and final code against REVIEW.md; advance, revise or escalate | Does not author the submission being evaluated |
| Integrator | Apply accepted platform policy to the exact reviewed revision | Separately held credentials; no policy bypass |

The controller launches a new process and records a unique invocation ID for each
role run. Separate IDs establish distinct executions, not security isolation or
model competence. The operator must enforce read/write and credential boundaries
in its runner wrappers/host. Neither distinct model names nor separate worktrees
establish those permissions by themselves.

Independent implementation tasks may run in separate worktrees with explicit file
ownership. Tasks sharing files run sequentially or through one owner. Integrate
their output before final verification and review. Native subagents are optional;
fresh sessions through the same runner protocol preserve portability.

For a routine finding, return actionable feedback to the responsible producer.
Escalate only a named authority/risk boundary, unavailable required verification,
unresolved material decision or exhausted budget. Include the relevant artifact,
evidence, attempted resolution and smallest decision that enables progress.

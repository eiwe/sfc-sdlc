# Spec: Autonomous portable SDLC

**Status:** Proposed for independent review
**Date:** 2026-09-05
**Intent:** [intent.md](intent.md)
**Decision:** [ADR-0003](../../decisions/0003-autonomous-portable-sdlc.md)

## Contract

1. One short AGENTS.md defines portable standing rules; CLAUDE.md imports it.
   One adoption skill supports Claude Code, Codex, Pi, and OpenCode. No model is
   hardcoded into workflow policy. Role/persona prompts do not grant authority.
2. A dependency-free Node controller owns a durable state machine: intent, design,
   plan, build, verification, review, ready, and optional integration. Independent
   review gates follow each planning artifact. Artifacts are committed before the
   next stage. All generated implementation/handoff changes precede final proof.
3. Trusted configuration supplies runner argv arrays for planner, implementer,
   verifier, and reviewer, plus a deterministic verification command. Each runner
   receives a JSON request on stdin and returns a JSON result on stdout. Native
   harness wrappers are configurable; no shell interpolation, model/API secret,
   deployment credential, or live external service is required by the test suite.
4. Runs are sequential at gates; independent implementation tasks may use separate
   worktrees under an external coordinator. Each invocation has a unique identity.
   The controller records exit status, bounded stdout/stderr, artifact digests,
   commit identity, role, decision, and timestamps; it never accepts a worker's
   own assertion that a deterministic command passed.
5. Changed inputs invalidate prior evidence. Verification/review cannot mutate
   the submitted tree. Missing/invalid results, nonzero checks, protected changes,
   out-of-scope paths, exhausted budgets, or unresolved revision loops cannot reach
   ready/integration. Revision requests return to the appropriate producing stage.
6. Persist progress atomically outside the checkout, prevent concurrent controllers
   for one run, and resume without rerunning accepted stages. Interrupted external
   integration is indeterminate and escalates instead of retrying a side effect.
   Bound attempts, elapsed time, output, and runner time. Actual monetary budgets
   remain a provider/deployment concern; do not infer cost from token guesses.
7. Policy, runtime, state, reviewer identity, and evidence need an operator-controlled
   execution boundary for authoritative enforcement. A local same-user trial is
   cooperative and must say so. Unknown tools/paths cannot count as protected by
   local heuristics. Protected platform/credential settings remain separate.
8. Shared hook normalization covers Claude Bash/PowerShell/Edit/Write, Codex
   Bash/apply_patch (all paths, including moves), Pi bash/edit/write, and OpenCode
   corresponding tool events. Thin adapters share decisions. Improve push parsing,
   accurately label production detection, and handle malformed configuration visibly.
9. Adoption previews, preserves pre-existing files/configuration, records installed
   version and content hashes, supports safe reruns, and reports conflicts instead
   of overwriting customized instructions. Install the runtime and selected adapters.
   CI placeholders fail; doctor reports incomplete commands, owners and conflicts.
10. Common review/testing/role procedures support task-scoped personas. Ordinary
    authorized work advances autonomously; explicit escalation rules cover authority
    expansion, production, destructive operations, SDLC changes, and exhausted budgets.
    Agent approval for routine work is an explicit SFC extension of the playbook.

## Proof

Node tests cover controller transitions, stale evidence, retry/resume, independent
roles, policy changes, timeouts, review mutation, protected paths, and a complete
fixture task plus an escalation. Adoption is tested in temporary repositories with
existing settings, repeated runs, conflicts and path safety. Adapter fixtures cover
all four protocols. Independent agents verify and review this actual implementation.
Live authenticated model sessions/platform settings are a separate compatibility tier.

## Non-goals

A hosted scheduler, general-purpose agent framework, billing system, automatic
credential provisioning, unconditional production access, or pretending local hook
regexes establish an adversarial security boundary. No new runtime dependencies.

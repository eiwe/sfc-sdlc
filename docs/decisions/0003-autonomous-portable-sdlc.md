# Decision: Evidence-gated autonomous teams across harnesses

**Status:** Proposed for independent review
**Date:** 2026-09-05
**Decider:** Eiwe through the accepted implementation request; independent design review

## Decision

Keep the playbook's committed artifact chain and independent gates. Delegate routine
stage approval to independently invoked agents within operator-approved policy;
escalate only when a named policy condition applies. This explicitly extends the
playbook's human approval examples using its headless maintenance confidence gates.
Supersedes ADR-0002's unconditional human approval for every routine stage, while
retaining human authorization of policy and exceptional production actions.

Use one dependency-free workflow controller and shared guard logic behind thin
Claude Code, Codex, Pi, and OpenCode adapters. Runner commands, models, and personas
are configured by the operator. Evidence is produced by the controller and bound
to committed inputs, not accepted from editable status strings.

## Trust and limitations

Authoritative deployment requires controller runtime, policy, state and integration
identity outside worker write access, enforced by the host/CI permissions. Putting
a state directory outside a checkout is necessary but is not sufficient isolation.
Same-user local runs demonstrate workflow semantics, not adversarial separation.
Default completion is a reviewed revision ready for integration. Automatic merge
requires an explicitly configured integration command and platform-side checks.

## Consequences

The same artifacts and results survive model/harness switches. Roles can vary in
persona without changing authority. This package has a small execution protocol
instead of owning providers or a scheduling service. Tests distinguish protocol
fixtures, cooperative local trials, and live harness/platform certification.

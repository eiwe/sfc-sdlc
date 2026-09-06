# Project rules

<!-- Fill in the project, architecture, commands and protected decisions. Keep this short. -->

## Project and commands

- Project: describe its purpose and main components.
- Verify: configure the real command; healthy output means all required checks pass.
- Default branch: `main`.

## Start and resume

Read `HANDOFF.md`, the active `docs/changes/<slug>/` artifacts and relevant ADRs.
When a controller run exists, inspect its status using `WORKFLOW.md`. Resume the
authorized scope; a new session, model or compaction does not erase authorization.
Investigate uncertainties independently. Escalate a missing decision only when it
materially changes the accepted outcome, risk or authority.

## Work and gates

Keep a committed `intent.md` → `spec.md` → `plan.md` chain before implementation.
Use brief artifacts for small tasks. An independent reviewing run accepts each
stage under the agreed policy; a persona or an editable “approved” label cannot
authorize work. Significant decisions need an ADR. Record scope changes and
invalidate affected approvals before continuing.

Implement within the approved paths. Run the verification command and independent
`TESTING.md` and `REVIEW.md` passes against the final revision. Resolve Important
findings; failed checks normally trigger repair within the configured budget.
Complete changelog and handoff changes before final verification and review.
Only the trusted integration route may merge an eligible revision.

A manually managed trivial change may omit intent/spec/plan with a reviewer-visible
reason. The controller always uses the brief three-artifact chain. Read-only
investigation or review requires neither a plan nor handoff/changelog edits.

## Boundaries

- Follow `ROLES.md` for independent author, verifier and reviewer responsibilities.
- For bug fixes, commit a test that fails for the intended reason before fixing
  code. Preserve that regression proof; follow the correction procedure in `TESTING.md`.
- Escalate authority expansion, unresolved product decisions, destructive actions,
  production operations, SDLC-control changes outside explicit authorization, and
  exhausted budgets. Existing bounded authorization remains valid.
- Production release authorization belongs to the accountable human and deployment
  controls. A shell environment variable or branch rule is not release approval.
- Never claim checks that did not run or commit secrets. See `WORKFLOW.md` for the
  distinction between local guardrails and host-enforced controls.
- Update durable handoff state after material project changes; keep changelog
  entries dated, concise and linked to a durable record.

## Settled decisions and recurring mistakes

<!-- Record protected architecture and corrections for mistakes made twice. -->

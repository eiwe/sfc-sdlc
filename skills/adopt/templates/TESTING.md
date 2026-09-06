# Testing policy

Configure one verification command that runs the project's required build, tests
and static checks and exits nonzero on failure. List it in `AGENTS.md`, CI and the
operator's controller policy. Record actual command output against the submitted
revision. Documentation-only work needs its applicable checks; new behavior and
bug fixes need meaningful coverage. Use synthetic data and isolated services.

## Verification

The implementer checks its work. A separate verifier exercises acceptance criteria
and nearby affected flows without repairing the submission. The controller runs
the deterministic command itself and captures its exit status; a model's assertion
that tests passed cannot substitute for it. UI changes also need visual inspection.

Finish changelog/handoff edits before final verification. Changes made afterward
require fresh affected checks and review. A failing check normally returns work
for repair within the run budget. Missing access, unavailable required checks or
exhausted retries escalate with evidence. Do not weaken checks to make a gate green.

## Bug fixes

1. Reproduce the defect as a test and confirm failure for the intended reason.
2. Commit that failing test and preserve its commit and output in the change record.
3. Fix the implementation while preserving the regression proof.
4. Run the regression and full applicable verification, then obtain independent review.

Controller fix mode (`taskKind: "fix"` with `testPaths`) executes the failing
regression stage after plan acceptance, requires independent failure review, and
freezes the committed test baseline through implementation. A command crash or
unavailable test is not evidence of the intended failure.

The optional `SDLC_PROTECT_TESTS=1` local guard catches supported editor operations
after step 2. It cannot cover arbitrary shell writes. Review the Git diff from the
regression commit to detect edited, renamed or removed tests. A trusted verifier
may enforce additional baseline rules mechanically. A green suite alone does not
establish a valid failing-test history.

If the test was wrong, obtain independent acceptance of the correction under the
existing scope, capture renewed failure evidence, and commit a new baseline.
The controller permits corrections during regression review. Once that baseline
is accepted, correcting it requires a fresh reviewed run under the existing
bounded authorization; build cannot rewrite an accepted baseline.
Escalate only when the correction changes intent, scope or protected policy.
Environment overrides are local guard configuration, never independent approval.

## CI and execution

Required checks run on every eligible PR; optional agent evals use a separate
workflow. Missing project commands must fail visibly. The changelog checker is
available as `node scripts/check-changelog.mjs CHANGELOG.md`.

Tests execute code controlled by the implementation. Run both tests and model
runners without controller-state access, integration credentials or standing
production permissions in an authoritative deployment; see `WORKFLOW.md`.

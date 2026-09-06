# GitHub integration

Work on feature branches and submit reviewed changes through pull requests.
The controller's default terminal result is `ready`; it does not provision GitHub
access or merge automatically. An operator may configure a trusted integration
command for routine eligible work. Production release remains a separate boundary.

## PR and evidence

Link the change's intent/spec/plan, relevant ADRs, exact submitted revision,
independent review findings and verification results. Include a dated concise
changelog entry and anticipated post-merge handoff state before final review.
For a manually managed trivial change, record the reason for each skipped planning
artifact. Use conventional commit messages and keep stage commits reviewable.

The implementer resolves Important findings and submits a new revision for fresh
verification/review. A model's claim of approval or an editable PR checklist does
not authenticate a gate. Retain controller evidence in operator-controlled storage
and link a sanitized durable reference from the PR.

## Configure protection

An administrator configures the repository's actual rules; adoption writes files
but does not change platform settings. Use the applicable GitHub plan/ruleset features:

- Require pull requests and uniquely named `verify` and `secret-scan` checks.
- Require up-to-date branch checks or a configured merge queue with matching CI events.
- Dismiss stale approvals and require approval of the most recent reviewable push.
- Require code-owner review for the human-governed escalation classes.
- Restrict bypass, force-push and administrative exceptions; keep worker identities
  unable to merge around the gates.
- Where supported, bind authoritative status checks to their expected GitHub App.

GitHub distinguishes stale-review dismissal, latest-push approval, status-check
sources and branch freshness; select them deliberately rather than assuming one
review setting provides all four.
[GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

The default CODEOWNERS payload covers the repository and explicitly names workflow
controls. Replace `@OWNER` with real owners. Existing project owners and protections
must be preserved during adoption; route application code as well as instructions,
skills, tests, CI, controller code, policy and change records.

## Autonomous integration

There are two valid operating policies. Projects retaining human code-owner
approval stop at `ready` until that review arrives. Projects delegating routine
approval configure a separate trusted reviewer/check publisher and integration
identity, while keeping human review for explicit escalation classes.

For delegated approval, the authoritative integration route must validate the
controller run's policy, exact PR head and review/verification evidence, and check
platform protection before merging. It must enforce protected-path escalation on
the actual diff. The implementing worker cannot possess its credentials, publish
the trusted gate result, change its runtime/policy, or approve its own PR.

Simply reducing the required approval count or disabling code owners is not that
integration. Install and validate the replacement control first. Native GitHub
review requirements apply to the whole branch unless the selected rules/features
provide the required conditional behavior; the external trusted route owns SFC's
risk classification. Do not give it blanket bypass credentials.

In controller policy, both `allowIntegration: true` and an `integrate` argv array
are required. The command receives revision-bound evidence through stdin and must
fail when the head or required checks change. If integration is interrupted or
times out, reconcile its external result before authorizing another run. A command
returning zero establishes only its configured success contract.

## CI

The installed workflow deliberately fails until the real verification command is
configured. Keep toolchain setup and dependency installation consistent with the
project. Run the changelog check and secret scan as required jobs on every PR.
Review/test commands execute repository-controlled code: exclude controller state,
privileged tokens and production credentials from their execution environment.

Optional behavioral evals belong in their own `agent-evals.yml`, scoped to changes
in instructions, skills, adapters, controller code and role policy. Do not put an
agent-configuration path filter on the entire required verification workflow;
a skipped required workflow can leave PR checks pending.
[GitHub workflow filters](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpull_requestpull_request_targetpaths)

Run fixtures on every package change, and live model evals on the operator's chosen
schedule/budget. Clearly distinguish those test tiers in the evidence.

## Production and releases

Production authorization is bound to the environment and release revision by the
deployment system and accountable human. Use scoped deployment credentials and
rehearsed rollback runbooks. GitHub environments can apply deployment protections;
feature availability depends on repository/plan configuration.
[GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)

Local command guards are optional assistance. Neither branch protection nor a
`SDLC_RELEASE_APPROVAL` value prevents direct infrastructure writes with existing
credentials. Workers should not hold those credentials.

Preserve stage commits when Git history supplies the artifact audit trail.
Squashing is acceptable only when the retained run/PR record independently
preserves stage revisions, approvals and timings. On release, move dated outcomes
from Unreleased into `## [VERSION] - YYYY-MM-DD` and follow the project's tag policy.

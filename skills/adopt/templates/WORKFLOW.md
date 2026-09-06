# Autonomous workflow

SFC runs a bounded task through committed planning artifacts, implementation,
deterministic verification, independent agent verification and review. Routine
stages advance without human prompts under the operator's accepted policy. It
uses Node and Git; model CLIs and credentials are supplied by the operator.

## Authority and deployment

The default local run is **cooperative**. State outside the checkout prevents
accidental inclusion in a diff; it does not prevent another process running as the
same user from modifying it. Hooks, role prompts and worktrees are not a sandbox.

For authoritative enforcement, the host must protect the controller executable,
policy, state, logs and integration credentials from all workers. Configure runner
wrappers to launch fresh, isolated sessions with task-scoped write access. Reviewers
must not receive implementation write access. Deterministic verification also runs
repository-controlled code and needs the same isolation from controller state and
credentials. A mode label cannot establish any of these permissions.

Protect Git metadata/configuration and the executable search path as well as the
worktree. Controller Git commands omit operator secrets, ignore global/system
configuration, disable hooks/signing/automatic maintenance, and reject configured
executable filters/diff drivers. These checks do not prevent same-user races or
replace host isolation. On Windows, the host must also contain descendant processes;
the bundled timeout cleanup kills process groups only on POSIX.

Production release authorization remains human-controlled through the deployment
platform. Workers hold no standing production credentials. Protect merge operations
with required checks and a separate integration identity. A local hook recognizing
a command or an environment variable cannot establish release authorization.

## Configure and run

Prepare a clean feature-branch checkout. Copy the installed `.sdlc/policy.json`
sample into an operator-controlled location, configure it, and review its policy
outside worker write access. A minimal policy shape is:

```json
{
  "version": 1,
  "mode": "cooperative",
  "runners": {
    "planner": ["/operator/bin/sfc-planner"],
    "implementer": ["/operator/bin/sfc-implementer"],
    "verifier": ["/operator/bin/sfc-verifier"],
    "reviewer": ["/operator/bin/sfc-reviewer"]
  },
  "verify": ["npm", "test"],
  "allowedPaths": ["src/", "tests/", "docs/changes/", "CHANGELOG.md", "HANDOFF.md"],
  "protectedPaths": [".github/", ".sdlc/", "scripts/sdlc/", "AGENTS.md", "CLAUDE.md"],
  "maxAttempts": 3,
  "maxInvocations": 40,
  "timeoutMs": 120000,
  "maxElapsedMs": 1800000
}
```

Replace example runner paths and verification with real commands. Values are argv
arrays, not shell strings; shell syntax requires an explicitly configured shell.
Path entries are repository-relative prefixes/exact paths, not glob patterns.
Keep allowed paths as narrow as the task requires and classify protected controls
before starting. Longer model work may need a larger operator-set timeout.

The bundled `scripts/sdlc/runner.mjs` bridges supported native CLIs to the role
protocol. Select `--harness claude|codex|pi|opencode` and an optional `--model`.
Custom wrappers may set model profiles/personas and host isolation. Read `ROLES.md`;
the native bridge alone does not confer separate credentials or a sandbox.

Optional `personas` maps role names to task-specific expertise instructions.
`passEnv`, `verifyEnv` and `integrationEnv` list environment variable names passed
to model runners, deterministic checks and integration respectively. Only pass
credentials to the role that needs them; ordinary HOME/PATH inheritance still
requires host isolation from sensitive files. `maxOutputBytes` caps captured
invocation output. These controls supplement the provider's own budget settings.

```bash
node scripts/sdlc/controller.mjs run \
  --repo /work/project --change add-search \
  --policy /operator/sfc/policy.json --state /operator/sfc/runs/add-search.json \
  --task 'Add search within the accepted product scope.'
node scripts/sdlc/controller.mjs status --state /operator/sfc/runs/add-search.json
```

A new run writes intent, spec and plan through the planner, obtaining independent
acceptance after each artifact. Producing runners submit edits without committing;
the controller checks allowed changes and commits the stage before the next gate.
The implementer finishes code, tests, changelog and handoff before final proof.
The deterministic command, verifier and reviewer evaluate the submitted revision.
Keep the three artifacts brief for small work; the controller has no silent
trivial-change bypass.

For a bug fix, configure `taskKind: "fix"` and `testPaths: ["tests/"]` (or the
project's literal test paths). After plan acceptance, the implementer submits only
regression tests and the controller commits them. The verification command must
fail normally; an independent
reviewer checks that failure against the intended defect. The controller preserves
the committed test baseline through the fix and rejects changes to it.

## Runner protocol

The controller starts each role command in the project and sends one JSON request
on stdin. Fields include `version`, `runId`, `role`, `stage`, `task`, `repo`,
`change`, `revision`, `feedback` and `artifacts`. Runners read the relevant committed
files and role procedure. They return one JSON object on stdout:

```json
{"decision":"advance","summary":"What was done or checked, with evidence and relevant limitations."}
```

Allowed decisions are `advance`, `revise` and `escalate`. Keep progress diagnostics
on stderr. A nonzero exit, malformed result or missing result cannot authorize the
next stage. The controller owns invocation identities and captured output; there
is no command for a worker to declare that it is an independent approver.

`advance` from a producer submits its output for the next gate. It does not approve
it. `revise` carries concrete findings to the responsible producer; `escalate`
states the policy condition, evidence and decision needed. Deterministic check
success comes from the controller's process result, never from these summaries.

## Resume, revisions and escalation

Rerun the same `run` command to continue recorded progress. Do not edit run JSON to
approve a stage, reset a budget or clear a failure. Accepted stages are reused only
while their inputs remain valid; changed artifacts/revisions invalidate affected
evidence and escalate for a fresh reviewed run. A changed policy requires a newly
authorized run. Locking prevents two
controllers from advancing one state file concurrently.

Clean between-stage checkpoints resume with the existing budgets. An interrupted
invocation escalates for reconciliation and a new run, because its effects may
have happened without a complete receipt. Interrupted integration is indeterminate:
inspect the external result before authorizing another run. This avoids silently
repeating a merge or other side effect.

Escalate an authority expansion, unresolved material product decision, protected
control change, destructive or production operation, unavailable required check,
or exhausted retry/time budget. Repair normal test/review findings within scope.
Authorization for a specific control change can be recorded in a bounded policy
before the run; it does not create general permission to rewrite controls.
Token/cost limits belong in the provider or host configuration, not estimated billing.

Terminal status `ready` means the revision passed the configured workflow and is
ready for integration. `complete` means a configured integration command succeeded.
`escalated` requires the stated decision; existing state remains an audit record
and reauthorization starts a new run.

Automatic integration is opt-in: configure both `allowIntegration: true` and an
`integrate` argv array. The trusted integration command must verify the intended PR,
exact submitted revision and all required platform checks; its exit status alone
does not prove what a poorly configured command did. The package does not provision
GitHub rules, credentials, production access or a hosted scheduler.

## Evidence and coverage

Run records include invocation identities, decisions, bounded output, revisions,
artifact digests and timestamps. Publish a sanitized reference to retained evidence
with the PR. Preserve stage commits when commit history is the audit record.
The verifier/reviewer judge artifact quality, acceptance coverage and bug-fix
regression history; deterministic gates establish only the conditions they check.

Protocol fixtures demonstrate controller and adapter behavior without paid model
calls. A same-user local trial demonstrates cooperative workflow execution. Live
harness, provider and platform certification requires exercising that actual
configuration and recording versions. Do not promote a fixture pass into a claim
that every model obeys policy or that deployment isolation has been verified.

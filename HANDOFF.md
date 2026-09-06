# Handoff

## Current change

`autonomous-portable-sdlc`, branch `feat/autonomous-portable-sdlc`.
The user authorized autonomous implementation and independent subagents, including
changes to this repository's workflow controls. No live platform/production changes
are authorized. Read the accepted intent, spec, plan and ADR-0003 before continuing.

## Implemented

Shared controller and role protocol; fresh native bridges for four harnesses;
revision-bound planning, verification, review, regression and opt-in integration
gates; bounded repair/escalation; safe installer/upgrade/doctor; shared guard policy;
lean policy documents and real fail-closed CI setup. Root verification is
`npm run verify`. No runtime npm dependencies are required.

## Evidence and resume

See [trial record](docs/changes/autonomous-portable-sdlc/trial.md) for independent
review, fixture/forward-test results and limitations. The accepted planning
commits precede implementation. This bootstrap used session subagents to follow
the method while building the controller; controller execution is tested separately
and is not retroactively claimed to have governed its own construction.

Do not treat a same-user runner, local hooks or a policy mode label as isolation.
Before authoritative autonomous use, provision protected runtime/policy/state,
isolated workers and tests, real model credentials, required platform checks and a
separate trusted integration identity. No merge or production deployment was performed.

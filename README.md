# Spec-First Collaborative SDLC

A lean, portable SDLC for autonomous teams using **Claude Code, Codex, Pi and
OpenCode**, aligned with Anthropic's
[AI-Native SDLC Playbook](https://claude.com/blog/the-ai-native-sdlc-playbook).

One shared artifact contract, a small dependency-free controller, and thin harness
adapters. Models and personas are configurable; authority belongs to the task and
policy, not a model name. Routine work advances through independent gates without
human prompts. Only explicit scope, authority, risk or exhausted-budget conditions
escalate.

Local execution is cooperative. Authoritative enforcement additionally needs
host isolation, protected policy/state and trusted platform integration. Installing
instructions or hooks alone cannot guarantee autonomous compliance.

## How the lifecycle works

The playbook's Plan → Design → Build → Test → Deploy → Maintain loop leaves a
committed artifact chain. Each nontrivial change lives in `docs/changes/<slug>/`.

| Stage | Artifact/evidence | Gate |
| --- | --- | --- |
| Plan | `intent.md`: outcome, scope and authority | Independent scope acceptance |
| Design | `spec.md` and significant ADRs | Independent requirements/decision acceptance |
| Build planning | `plan.md`: ownership, risks and proof | Independent plan acceptance before code |
| Build | Implementation, tests, changelog and handoff | Allowed scope and frozen planning inputs |
| Test | Actual check output plus independent verifier | Passing evidence on the submitted revision |
| Review / integration | Independent review, run record and PR | Current approvals and trusted platform checks |
| Maintain | Incident/new intent and regression proof | Re-enter the bounded workflow |

Seven logical gates remain: intent, decision, spec, plan, test, review and handoff.
The controller creates fresh role invocations and commits submitted stage output.
Failures return to the responsible role within time/attempt limits. Bug-fix mode
requires a failing regression test before implementation and freezes that baseline.
Evidence becomes stale when its inputs change.

Keep artifacts brief. A manually coordinated trivial change may record justified
planning exemptions; controller runs always use the short three-artifact chain.
Production release remains a separately authorized human/platform boundary.
Delegating routine approval is an explicit SFC extension of the playbook, not a
claim that its earlier human gates disappeared. See
[methodology](docs/SDLC.md) and [playbook alignment](docs/PLAYBOOK_ALIGNMENT.md).

## What enforces it

| Layer | Ships here | Limit |
| --- | --- | --- |
| Shared instructions | AGENTS.md, CLAUDE.md import, roles, review/testing and artifact templates | Guidance, not a sandbox |
| Local adapters | Claude hooks, Codex hooks, Pi extension, OpenCode plugin | Recognized operations only; unknown tools/shell writes can escape coverage |
| Controller | Independent invocations, scope/freshness checks, receipts, budgets and recovery | Same-user runs remain cooperative |
| CI and platform | Failing-until-configured CI, changelog checker, CODEOWNERS template | Operator must configure real checks, isolation and trusted merge/release identities |

Guard policy is shared. Malformed recognized inputs fail visibly. Local environment
overrides are configuration, not authenticated approval; the production guard's
acknowledgment now requires exact command/cwd/expiry/reference JSON, not a ticket
string. See [compatibility and coverage](docs/COMPATIBILITY.md).

## Install and adopt

Install the skill once, then adopt each project. Existing project instructions,
settings and unrelated hooks are preserved; a pre-existing AGENTS.md is not proof
of complete adoption.

| Harness | Skill installation and discovery |
| --- | --- |
| Claude Code | `/plugin marketplace add eiwe/sfc-sdlc`, `/plugin install sdlc@sfc-sdlc`, `/reload-plugins`, then `/sdlc:adopt` |
| Codex | Copy the whole `skills/adopt/` directory to `.agents/skills/adopt/`; invoke `$adopt` or `/skills` |
| Pi | `pi install git:github.com/eiwe/sfc-sdlc`, then `/skill:adopt` |
| OpenCode | Copy the whole `skills/adopt/` directory to `.agents/skills/adopt/`; ask it to load `adopt` |

The deterministic installer also works directly from this clone, without a model:

```bash
# Preview only; replace the command and owner with the project's actual values.
node skills/adopt/scripts/adopt.mjs --target /path/to/project \
  --harnesses claude,codex,pi,opencode \
  --verify-command 'npm test' --owner '@project-owner'

# Repeat with --apply to install; later reruns safely upgrade unchanged managed files.
node skills/adopt/scripts/adopt.mjs --target /path/to/project --doctor
```

Resolve reported conflicts by merging project policy, not overwriting it.
Use `--accept-existing PATH` to acknowledge reviewed supported document/configuration
merges; executable guards and hook wiring must match the required configuration.
Manually merged CI must retain the complete marked executable verification block.
Fill in AGENTS.md commands/constraints, meaningful HANDOFF.md state and real CI
runtime/dependency setup. Run actual verification, doctor, review and commit.
Doctor detects structural incompleteness; it does not certify model access or CI semantics.

Trust project hooks/extensions through each harness's native mechanism.
Configure platform gates using [the GitHub workflow guide](docs/GITHUB_WORKFLOW.md).
Adoption does not alter live repository rules or grant credentials.

## Run an autonomous team

Read [WORKFLOW.md](skills/adopt/templates/WORKFLOW.md). Copy the installed
`.sdlc/policy.json` sample outside the worker checkout and configure real runner
argv arrays, verification, bounded paths, personas and budgets. The empty sample
verification command deliberately cannot run.

```bash
# From an adopted project; production deployments must protect this runtime.
node scripts/sdlc/controller.mjs run \
  --repo /work/project --change add-search \
  --policy /operator/sfc/policy.json --state /operator/sfc/runs/add-search.json \
  --task 'Add search within the accepted scope.'
node scripts/sdlc/controller.mjs status --state /operator/sfc/runs/add-search.json
```

Use `runner.mjs --harness claude|codex|pi|opencode` with optional `--model`, or
supply isolated operator wrappers. Planner, implementer, verifier and reviewer may
use different providers and personas. Native model availability is a provider
configuration detail; no specific model is hard-coded.

The controller runs gates sequentially. A coordinator may delegate independent
implementation tasks to subagents with explicit file ownership/worktrees, then
submit the combined revision for independent verification and review. This is not
a hosted scheduler or a native cross-provider subagent service.

`ready` means accepted for integration. `complete` means an explicitly configured
trusted integration command succeeded. `escalated` preserves the reason and audit
record. Interrupted external actions require reconciliation, never blind retry.
Automatic merging needs a separately provisioned trusted integration command;
production deployment is not implicitly authorized.

## Automatic use and durable context

The skill is a bootstrap, not a per-session daemon. AGENTS.md and the CLAUDE.md
import bridge carry standing rules; HANDOFF.md, accepted artifacts and external
controller state carry progress. Read them on session start, compaction and harness
switch. Native context-loading details vary; disk-backed rules make recovery
possible but cannot guarantee model obedience.

## Repository layout and development

- `skills/adopt/SKILL.md` — lean shared adoption/follow-workflow skill.
- `skills/adopt/scripts/adopt.mjs` — preview/apply/upgrade/doctor.
- `skills/adopt/templates/` — portable policy documents, native adapters and runtime.
- `tests/` — installer, guards, native protocol and full workflow/crash regressions.
- `docs/` — methodology, compatibility, playbook mapping, platform setup and ADRs.
- `example/minimal-adoption/` — populated instructions and changelog example.

```bash
npm run verify          # All tests, changelog validation and whitespace checks
npm test                # No paid provider calls; isolated deterministic fixtures
npm run check:changelog
```

Node 22+ and Git; CI uses Node 24. No runtime npm dependencies.
This implementation followed committed planning and independent subagent reviews;
see the [dogfooding trial](docs/changes/autonomous-portable-sdlc/trial.md) for actual
results, detected defects and validation limits.

## License

MIT — see [LICENSE](LICENSE).

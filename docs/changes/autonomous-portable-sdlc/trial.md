# Autonomous implementation trial — 2026-09-05

## Authorization and planning

The user requested autonomous implementation with spawned agents, including
using the proposed method while changing this repository. That bounded authority
covers this package's workflow controls, not live branch rules, credentials or
production. No extra routine human approvals were requested.

The committed sequence precedes implementation:

1. `8a0817e` — captured user intent.
2. `ff3181b` — proposed requirements and trust boundaries.
3. `b67d86e` — implementation ownership and verification plan.
4. `ab30f41` — recorded independent architect acceptance of the proposed design.

The coordinator owned controller/integration; separate agents owned adapters,
adoption and documentation. Write ownership prevented overlapping code edits.
The documentation author first served as architect, then switched roles only
after design acceptance. Final review was cross-assigned so authors did not
approve their own implementation.

## Independent gates and repairs

| Reviewer | Independent scope | Result |
| --- | --- | --- |
| Adoption agent | Coordinator's controller | Accepted after evidence/crash defects were repaired |
| Documentation/design agent | Adapter/native runner and installer | Accepted after final-message and incomplete-CI defects were repaired |
| Adapter agent | Installer, documentation and root integration | Accepted after hook-upgrade and private-PR secret-scan defects were repaired |

Important findings led to concrete repairs and regression tests:

- Planning-stage writes are limited to their active artifact and design ADRs.
- Producers submit edits; the controller owns Git commits, matching native sandbox behavior.
- Hidden index flags cannot conceal differences between checked and committed code.
- Planning artifacts must be regular files and their hashes include every byte.
- Interrupted integration retains indeterminate pending state until receipt and
  terminal completion are committed atomically; resume cannot repeat the side effect.
- Controller Git commands omit operator secrets, reject executable filters/diff
  drivers and disable global/system configuration, hooks and automatic maintenance.
- OpenCode's verdict must belong to the final completed message, not a previous step.
- A live Pi probe exposed its additional `agent_settled` completion event; the
  adapter's lifecycle handling and regression coverage were revised accordingly.
- Exact manually completed hook upgrades are recognized without accepting partial wiring.
- Doctor requires the entire configured command in an executable marked CI block;
  a comment or an omitted final test command cannot report complete adoption.
- Gitleaks receives private-PR read permission without comment/write permission.

The independent controller review bound its approval to SHA-256
`e3e55bad955540a162ce692803570f5007f3bbbf0d34b5dee70f565363c763a6`.
All reported Important findings within the reviewed implementation scope were
resolved. This does not prove the absence of defects or certify host isolation.

## Executed verification

The initial integrated `npm run verify` passed: **98 tests, zero failures**, three
changelog validations, and `git diff --check`, using Node 26.7.0 and Git 2.55.0.
Post-probe regression verification is recorded below. No paid model calls occur
in the automated suite.

After reproducing and correcting the Pi lifecycle defect, `npm run verify` passed
again with **100 tests, zero failures**, all three changelog checks and clean
whitespace. The updated native runner passed separate independent source review
and all ten runner tests, including stale/retry/failed-settlement cases.

The suite includes complete happy-path progression through fresh independent
invocations, actual-check failure and repair, independent rejection and bounded
disagreement, protected/out-of-scope changes, stale planning/revisions, regression
test preservation, environment filtering, malformed results and timeout behavior.
Three real child-process death tests cover before integration, after its external
effect before receipt, and after the terminal receipt. Resuming twice leaves the
fixture integration counter at exactly one; ambiguous completion escalates.

The adoption agent also followed the actual skill in an isolated pre-existing
project with custom AGENTS.md and Claude permission/hook settings. It preserved
those settings, resolved documented conflicts, obtained doctor exit 0, reran with
no changes and passed that fixture project's actual test command. This was an
exercise of skill instructions, not just a helper-unit-test claim.

## Live bridge smoke

Read-only reviewer requests inspected a tiny temporary README through the native
runner bridge, with existing defaults and no model override or permission bypass.
The temporary repository remained clean.

| Harness | Locally observed version | Result |
| --- | --- | --- |
| Codex | 0.153.1 | Valid advance JSON matching README content; 22.6 seconds |
| Claude Code | 2.1.260 | Valid advance JSON matching README content; 11.6 seconds |
| Pi | 0.84.4 | Post-fix valid advance JSON matching README content; 26.1 seconds |
| OpenCode | Not installed on PATH | Protocol/source checks only; no live invocation |

The first Pi attempt reached 55 seconds; a diagnostic retry completed but revealed
that its terminal `agent_settled` event was rejected. After the narrowly scoped
fix and independent review, one final bounded live check passed through the updated
parser. It used `pi -p --mode json --no-session --tools read,bash,grep,find,ls`,
exited zero without stderr and left the temporary checkout clean. The tested runner
SHA-256 was `1c1d6e0ce9f957234a44039408edf56c8ceb334672d64f1496de8d4d84781448`.

These results establish three live bridge round-trips, not full end-to-end provider,
skill/hook activation, model identity or cross-harness handoff certification.
Native Codex/Claude/Pi help and documented OpenCode event shapes were also inspected.

## Deviations and remaining deployment work

This is a bootstrap trial: the session coordinator and subagents followed the
artifact/review method while building the controller. The new controller is
exercised separately with deterministic workers; it did not govern its own
construction retroactively. Focused failing probes preceded repairs, but their
permanent regression tests landed with the implementation rather than as separate
committed failing-test baselines. Future controller bug-fix tasks should use the
implemented `taskKind: "fix"` sequence.

The existing user README edits were integrated into the updated lifecycle/gate
explanation, not discarded. A pre-edit copy was retained locally during this task.
Accepted planning artifacts were not rewritten to conceal implementation findings;
the ownership/commit clarification and fixes are recorded above.

No platform rules were changed, no trusted merge service was provisioned, and no
production action was performed. Authoritative deployment still needs protected
runtime, Git metadata/configuration, executable paths, policy/state and credentials;
isolated model and verification workers; project-native trust settings; and a
trusted integration command validating the exact PR revision and required checks.
Windows descendant containment needs host support. Provider budgets and scheduling
also belong to the host/provider. These are explicit setup boundaries, not features
that an installed repository can honestly claim to enforce by itself.

GitHub Actions runtime versions follow current upstream guidance:
[checkout](https://github.com/actions/checkout),
[setup-node](https://github.com/actions/setup-node) and
[Gitleaks v3](https://github.com/gitleaks/gitleaks-action/releases).
Live GitHub Actions and platform protection were not executed locally.

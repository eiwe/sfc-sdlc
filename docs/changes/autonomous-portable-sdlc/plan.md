# Plan: Autonomous portable SDLC

**Status:** Approved
**Approved by:** Independent architect `/root/design_review`, revision b67d86e, 2026-09-05
**Date:** 2026-09-05
**Spec:** [spec.md](spec.md)

## Files and ownership

- Coordinator: `skills/adopt/templates/scripts/sdlc/controller.mjs`, controller tests,
  repository package/CI integration, root dogfooding files and trial evidence.
- Adapter implementer: shared guards/native runner bridge under
  `skills/adopt/templates/scripts/sdlc/`, four native adapter payloads, adapter tests.
- Adoption implementer: `skills/adopt/scripts/adopt.mjs`, adoption tests; installation
  manifest, merge/preview/doctor behavior. Coordinates payload paths with adapters.
- Documentation implementer (after design review): skill, portable policy templates,
  methodology/compatibility/GitHub docs, roles and worked-example alignment.
  README is reserved for the coordinator to preserve the user's existing changes.

## Order

1. Commit accepted intent, proposed spec and plan separately. Independent reviewer
   challenges them before code. Record its decision, then commit accepted artifacts.
2. Parallel implementation within the listed ownership boundaries. Controller and
   installer interfaces are fixed in the spec and coordinator messages.
3. Run fixture and repository checks, resolve failures; independently inspect the
   actual skill in an isolated adoption exercise.
4. Separate verification and code review evaluate the complete implementation.
   Resolve Important findings, rerun affected checks and bind evidence to revisions.
5. Record trial outcomes, limitations and next-step commands in HANDOFF/CHANGELOG;
   commit implementation on the feature branch. Do not modify live platform controls.

## Risks and proof

Trust-boundary overclaims are the primary risk: docs must distinguish host-enforced
isolation from same-user cooperative execution. Adapters must cover real tool payloads,
including multiple patch paths. Installer must never clobber existing files or follow
symlinks out of its target. Controller tests must prove denied/stale evidence cannot
advance and interrupted integration cannot execute twice. All testing is isolated and
requires no production credentials. Existing 27 tests remain green or are updated only
for deliberate contract changes, with rationale.

## Deviations

None at proposal. The existing README worktree changes remain user-owned.

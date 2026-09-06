# SFC development contract

This dependency-free Node package supplies portable SDLC instructions, a safe
installer, local guard adapters and a bounded autonomous controller. Read
`HANDOFF.md`, the active `docs/changes/<slug>/` artifacts and relevant ADRs first.
Claude Code reads these same rules through `CLAUDE.md`.

## Commands

- `npm run verify` — all Node tests, three changelog checks and whitespace checks;
  healthy output has zero failed tests, three `changelog format OK` messages, exit 0.
- `node skills/adopt/scripts/adopt.mjs --target /tmp/example --doctor` — inspect an
  existing adoption; incomplete configuration exits nonzero. Preview before apply.

## Workflow and authority

Follow `docs/SDLC.md`; shared role, review and test procedures live in
`skills/adopt/templates/{ROLES,REVIEW,TESTING}.md`. Controller operation and trust
boundaries are in `skills/adopt/templates/WORKFLOW.md`.

Commit intent, spec and plan before nontrivial implementation; obtain independent
acceptance at each gate. Split independent work by explicit file ownership.
Implementers do not approve their own work. Final checks and review evaluate the
combined revision, including handoff/changelog. Reproduce bugs before fixing them.

The current autonomous-portable-sdlc change is explicitly authorized to modify
this package's controls. That does not authorize changing live platform rules,
credentials, production or unrelated user files. Routine repairs stay autonomous;
escalate scope/authority changes, destructive actions, missing required verification
and exhausted budgets. Record deviations instead of rewriting accepted inputs.

## Things agents get wrong

- Files and hooks are not host isolation. Never call fixture coverage live model
  certification or equate a mode label with enforced permissions.
- Preserve existing project instructions/settings during adoption; AGENTS.md
  alone does not mean adoption is complete. Never silently skip required CI.
- Native payloads differ, including patch moves and final-message identifiers.
  Add adversarial tests when changing adapters or evidence handling.
- Worker runners submit edits; the controller owns stage commits. Reviews and
  verification do not repair the submission they are evaluating.
- Do not commit temporary provider logs or credentials. Keep external run state
  outside worker checkouts and sanitize retained evidence.

# notekeep project rules

A fictional Python CLI storing local notes, with create, list, search and tagging.
These are populated example instructions; this folder does not contain the runnable
application. Claude Code reads them through CLAUDE.md; Codex, Pi and OpenCode use
AGENTS.md through their native project discovery.

## Commands and architecture

- Verify: `pytest -q`; healthy result: all tests pass.
- Install: `pip install -e .`.
- Static checks: `ruff check . && mypy notekeep`.
- Run: `notekeep --help`. Default branch: `main`.
- `notekeep/cli.py` dispatches commands; `store.py` owns SQLite access;
  `models.py` defines Note; tests live under `tests/`.

## Start and work

Read HANDOFF.md, the active `docs/changes/tagging/` artifacts and ADR-0001.
Continue the approved scope across sessions and harness changes. Investigate
ordinary questions independently; escalate material product/authority decisions.

Commit intent → spec → plan before implementation; independent review accepts
each artifact under the configured policy. Brief artifacts are sufficient.
Significant changes require an ADR. Use the installed WORKFLOW.md and ROLES.md
for controller execution, status and role separation.

Implement the plan, cover new behavior and reproduce bugs with committed failing
tests before fixes. Complete changelog/handoff changes, then obtain actual
verification and independent REVIEW.md/TESTING.md passes on the final revision.
Changed revisions need fresh evidence. Routine failures return for bounded repair;
the trusted integration route controls merge.

Read-only reviews do not change handoff/changelog. A manually managed trivial
change may omit planning artifacts with explicit reviewer-visible reasons; the
controller always uses the brief artifact chain.

## Boundaries and settled decisions

- Escalate production/destructive actions, authority expansion, unapproved control
  changes, missing required verification and exhausted budgets.
- Production release authorization belongs to the accountable human and deployment
  system. Local guard variables and branch rules do not authorize infrastructure writes.
- Storage remains SQLite through store.py (ADR-0001). Supersede that ADR before
  changing storage. Its explicit schema/migration review boundary remains in force.
- Never commit secrets or claim checks that did not run. Local cooperative execution
  does not establish isolation of trusted controls and credentials.

## Recurring mistakes

- Database access goes through store.py; do not open sqlite3.connect from CLI or tests.
- Schema changes are additive forward migrations. Editing an existing migration
  makes fresh-database and upgrade behavior diverge.

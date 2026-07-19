# AGENTS.md

Universal, tool-agnostic project rules. Every agent reads this file first at the start of every session.

## Project

<!-- One-paragraph summary of what this project does and who it is for. -->

## Commands

<!-- Exact commands to run for common tasks: build, test, lint, migrate, deploy. -->

```bash
# Example: run tests

# Example: compile/check

# Example: deploy
```

## Hard rules

<!-- Non-negotiable constraints. Use direct imperatives. -->

- Never commit secrets, tokens, or machine-specific paths.
- Never write to production systems without explicit human confirmation.
- Never skip the test suite.
- Never leave a session without updating `HANDOFF.md`.

## Architecture

<!-- Brief summary of the architecture and where key things live. -->

## Do not change

<!-- Things that are settled and should not be reopened without a superseding decision record. -->

## Where things live

- Decisions: `docs/decisions/`
- PRDs/specs: `docs/prd/` or `docs/specs/`
- Skills/repeatable workflows: `skills/`
- Release log: `CHANGELOG.md`
- Handoff: `HANDOFF.md`
- Test policy: `TESTING.md`

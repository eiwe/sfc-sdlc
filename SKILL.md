# Skill: Spec-First Collaborative SDLC

Trigger: the user wants to start, adopt, or follow the Spec-First Collaborative SDLC in a project.

## Purpose

This skill helps apply a document-driven, agent-friendly software development lifecycle. It is tool-agnostic and works for projects using Claude Code, Pi, Kimi K3, or other AI agents.

## Workflow

### When adopting the SDLC in a new repo

1. Copy `templates/AGENTS.md`, `templates/HANDOFF.md`, `templates/CHANGELOG.md`, `templates/TESTING.md`, and `templates/.github/pull_request_template.md` into the repo root.
2. Create `docs/decisions/` and `docs/prd/` directories.
3. Fill in project-specific rules in `AGENTS.md`.
4. Write the initial `HANDOFF.md` with the project’s current state.
5. Tell the user the SDLC is adopted and what documents to maintain.

### At the start of every work session

1. Read `HANDOFF.md`.
2. Read `AGENTS.md`.
3. Read relevant PRDs and ADRs for the task.
4. Confirm the task scope with the user if it is unclear.

### When planning a non-trivial change

1. Ask whether an ADR or PRD already exists for the area.
2. If not, draft the PRD first; ask the user to review before implementing.
3. If the change alters a previous decision, draft a superseding ADR.

### Before finishing work

1. Run the test suite and any configured static checks.
2. Perform live verification if applicable.
3. Open or update a PR using the template.
4. Update `CHANGELOG.md` and `HANDOFF.md`.

## Rules

- Never implement a non-trivial feature without a PRD.
- Never change a settled design without a superseding ADR.
- Never skip the test gate.
- Never leave a session without updating `HANDOFF.md`.
- Treat context documents as code: changes need review and traceability.

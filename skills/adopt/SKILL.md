---
name: adopt
description: >-
  Adopt, upgrade or follow the Spec-First Collaborative SDLC in a repository.
  Installs portable workflow artifacts and optional autonomous team controls for
  Claude Code, Codex, Pi and OpenCode using one shared policy and independent gates.
license: MIT
---

# Spec-First Collaborative SDLC

Use this skill to bootstrap or upgrade a project's durable SDLC. Templates and
the dependency-free installer are bundled beside this file. Standing instructions
belong in the installed `AGENTS.md`; do not repeat this skill each session.

## Adopt or upgrade

Inspect the repository's existing instructions, commands and workflow before
installing. A pre-existing `AGENTS.md` does not prove SFC adoption. The versioned
installation record is `.sdlc/installation.json`.

From this skill's directory, preview the install into the requested project:

```bash
node scripts/adopt.mjs --target /path/to/project \
  --harnesses claude,codex,pi,opencode \
  --verify-command 'npm test' --owner '@project-owner'
```

Select the requested harnesses and substitute the actual verification command and
owner. The installer previews by default; use `--apply` for the authorized install.
Preview is an inspection step, not a new permission requirement. Existing approval
to adopt covers ordinary, reversible scaffold changes.

Preserve project instructions, Claude settings, CI, owners and changelog history.
The installer merges supported configuration and reports customized-file conflicts
instead of overwriting them. Resolve conflicts by integrating only the SFC material
into the current files, preserving project policy. Never replace an existing file
blindly or use the mere presence of AGENTS.md to skip an incomplete installation.
After reviewing a manual merge, use `--accept-existing PATH` (repeatable) to record
the accepted document/configuration alongside its upstream template hash. This
acknowledgment is limited to supported files, not executable guards or hook wiring.
Later upstream changes become conflicts for a fresh merge.
For manually merged CI, retain the complete executable verification command inside
the `SDLC_VERIFY_COMMAND_BEGIN` / `SDLC_VERIFY_COMMAND_END` block so doctor can
check it. Doctor does not execute the command or certify the workflow's semantics.

Fill in the project summary, architecture, real commands and protected decisions in
`AGENTS.md`, and meaningful initial state in `HANDOFF.md`. Keep standing rules short.
The shared controller, `WORKFLOW.md`, `ROLES.md`, review/testing procedures and selected
harness adapters are installed together. Configure autonomous runners only within
existing authorization; model credentials and trusted host controls are operator setup.

Run the actual verification command and the adoption check:

```bash
node scripts/adopt.mjs --target /path/to/project --doctor
```

The JSON reports list changes, conflicts and incomplete configuration. Resolve
applicable conflicts and missing commands/owners; do not report complete adoption
while required CI remains a placeholder or doctor fails. Stage the intended files
explicitly and commit when repository/task authorization includes commits.

Report what was installed, the commands actually verified, and any remaining host
or platform setup. Local hooks are limited guardrails. A same-user controller is
cooperative; authoritative enforcement needs the boundary described in WORKFLOW.md.
Do not claim live harness/model compatibility from fixtures or installed files.

## Follow an adopted workflow

Read `AGENTS.md`, `HANDOFF.md`, the active change artifacts and relevant ADRs.
Use `WORKFLOW.md` for controller policy, role protocol, execution and resume, and
`ROLES.md` for task-scoped responsibilities.

Preserve authorization across sessions and harness switches. Investigation and
read-only reviews may proceed without a plan and do not require handoff edits.
Implementation follows the committed intent → spec → plan chain and independent
gates; routine feedback returns to the producing agent within budget. Only named
authority/risk boundaries and unresolved required decisions escalate to a human.

## Discovery

- Claude Code: `/sdlc:adopt` from the plugin or `/adopt` as a standalone skill.
- Codex: install this whole `adopt/` directory under `.agents/skills/`; invoke
  `$adopt` or select it through `/skills`.
- Pi: the existing package or `.agents/skills/adopt/`; invoke `/skill:adopt`.
- OpenCode: `.agents/skills/adopt/`; ask it to load the `adopt` skill.

Install one canonical skill copy per discovery scope; overlapping duplicate copies
can produce ambiguous names. The repository's compatibility guide links the primary
harness documentation: https://github.com/eiwe/sfc-sdlc/blob/main/docs/COMPATIBILITY.md.

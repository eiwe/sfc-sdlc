# Compatibility: Claude Code and Pi

How this repo maps onto each harness's conventions, and why the design survives
long-running, multi-session development.

## The shared foundation

Both harnesses independently converge on two conventions, which is what makes one
artifact work in both:

| Concern | Claude Code | Pi | Shared choice here |
| --- | --- | --- | --- |
| Skill file | `SKILL.md` + YAML frontmatter `name`/`description` (agentskills.io) | `SKILL.md` + YAML frontmatter `name`/`description` (same constraints) | One `skills/adopt/SKILL.md` |
| Skill name rules | ≤64 chars, lowercase/digits/hyphens | ≤64 chars, lowercase/digits/hyphens | `adopt` (plugin `sdlc`) |
| Bundled skills dir | `skills/<name>/SKILL.md` at plugin root | `skills/<name>/SKILL.md` auto-discovered in a package | `skills/adopt/` |
| Session context file | `CLAUDE.md` (not `AGENTS.md`) | `AGENTS.md` **or** `CLAUDE.md`, natively | `AGENTS.md` + `CLAUDE.md` bridge |
| Enforcement | hooks (`.claude/settings.json`), CI | extensions, CI | GitHub branch protection + CI; CC hooks |

## Persistence across sessions and compaction

The rules must survive `/clear`, restarts, and context compaction. The reliable
mechanism in **both** tools is the auto-loaded on-disk context file — not the skill
body, and not chat history.

- **Pi** loads `AGENTS.md` (or `CLAUDE.md`) from `~/.pi/agent/AGENTS.md`, ancestor
  directories, and the cwd, concatenated into the system prompt every session.
  The system prompt and context files are **not** stored in the session transcript;
  they are rebuilt from disk on every load, and compaction only summarizes message
  history. So a rule in `AGENTS.md` is immune to compaction and re-read on restart
  with no manual step. (`/compact` exists; `/new` — not `/clear` — starts fresh.)
- **Claude Code** auto-loads project-root `CLAUDE.md` every session and
  **re-injects it from disk after `/compact` and `/clear`**. `CLAUDE.md` here is a
  one-line `@AGENTS.md` import, so the same rules load. (Claude Code does *not* read
  `AGENTS.md` natively — anthropics/claude-code#34235 is open — which is why the
  bridge is required.)

Why not rely on the skill? Skill bodies do not auto-load; only their short
description does, and in Claude Code the skill *listing* is dropped after
`/compact`. A skill is the right home for the *bootstrap procedure*, not for
standing rules — those live in `AGENTS.md`.

## Enforcement (gates are guidance until enforced)

Both tools treat context files as guidance with no guarantee of compliance, so
hard gates are layered on:

- **Tool-agnostic (primary):** GitHub branch protection (require PR + review +
  passing CI, block direct pushes to the default branch) and the CI workflow in
  `.github/workflows/ci.yml`. This holds regardless of harness or OS. Setup steps
  are in [`GITHUB_WORKFLOW.md`](GITHUB_WORKFLOW.md).
- **Claude Code (secondary):** `.claude/settings.json` ships a `SessionStart` hook
  (fires on startup/resume/clear/compact) that reminds the agent to read
  `HANDOFF.md`/`AGENTS.md`, and a `PreToolUse` hook that runs
  `.claude/hooks/guard-push.mjs` — a cross-platform Node guard that blocks
  `git push` to a protected branch. Both hook scripts are referenced via
  `${CLAUDE_PROJECT_DIR}` so they resolve regardless of the working directory.
  Override an intentional push with `SDLC_ALLOW_PUSH_MAIN=1`.
- **Pi (secondary):** the always-loaded `AGENTS.md` carries the same rules into
  the system prompt. Pi extensions (TypeScript) can add active guards; this repo
  does not ship one, deferring hard enforcement to GitHub, to keep the package
  code-free and portable.

## Install-role matrix

A skill's `SKILL.md` is byte-identical whether it runs standalone or bundled, as
long as it avoids plugin-only path variables (this one does — it references its
`templates/` relatively).

| Install | Claude Code | Pi |
| --- | --- | --- |
| From this repo as plugin/package | `/plugin marketplace add eiwe/sfc-sdlc` → `/plugin install sdlc@sfc-sdlc` → `/reload-plugins` | `pi install git:github.com/eiwe/sfc-sdlc` |
| Local, no install | `claude --plugin-dir ./` | `pi --skill ./skills/adopt` |
| Standalone skill | copy `skills/adopt/` → `~/.claude/skills/adopt/` | copy `skills/adopt/` → `~/.pi/agent/skills/adopt/` |
| Invoke (one-time bootstrap) | `/sdlc:adopt` (plugin) or `/adopt` (standalone skill) | `/skill:adopt` |

Note: when copying the **standalone skill**, copy the inner `skills/adopt/`
folder (which has no `.claude-plugin/plugin.json`). Copying the whole repo into a
skills directory would instead load it as a skills-directory *plugin*.

## Pi package discovery

This repo has no `pi` key in `package.json`, so Pi auto-discovers the conventional
`skills/` directory (recursive `SKILL.md`). If a future Pi version needs an explicit
manifest, add:

```json
"pi": { "skills": ["./skills"] }
```

## Sources

Verified 2026-07-19 against primary docs: code.claude.com/docs (skills, plugins,
plugins-reference, plugin-marketplaces, memory, hooks, context-window),
pi.dev/docs and github.com/earendil-works/pi (README, docs/skills.md,
extensions.md, packages.md, prompt-templates.md, compaction.md, session-format.md),
and agents.md.

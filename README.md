# Spec-First Collaborative SDLC

A document-driven software development lifecycle for building software with AI
agents. Requirements and decisions are written before code, and the durable rules
live in a context file the harness reloads every session — so the process is
**consistently followed across sessions, `/clear`, and context compaction**.

It ships as a single artifact that installs as a **skill or plugin in Claude Code**
and as a **skill or package in the [Pi coding harness](https://pi.dev)**, built on
conventions both tools share (`SKILL.md` skills and the [`AGENTS.md`](https://agents.md)
open standard).

## How it stays adhered to across sessions

The methodology has two layers:

1. **The distributable skill/plugin (this repo)** — the bootstrap. Invoking it
   scaffolds the SDLC into a target project.
2. **What it installs into your project** — the durable layer. The rules live in
   `AGENTS.md`, which **both harnesses auto-load every session and rebuild from
   disk after compaction** (Pi reads `AGENTS.md` natively; Claude Code reads
   `CLAUDE.md`, which imports it via `@AGENTS.md`). Skills and chat history do not
   survive compaction reliably — the context file does, which is why the rules
   live there. Hard gates are enforced by GitHub branch protection + CI and by
   editor hooks, because both tools treat context files as guidance, not law.

## Install

Repository: **https://github.com/eiwe/sfc-sdlc**

You install the plugin **once**, then run the `adopt` bootstrap **once per repo**.
After that the SDLC applies automatically — see [Automatic use](#automatic-use-no-per-session-invocation).

### Claude Code

```
# Install the plugin (once)
/plugin marketplace add eiwe/sfc-sdlc
/plugin install sdlc@sfc-sdlc
/reload-plugins
# Bootstrap a repo (once, from inside that repo)
/sdlc:adopt
```

`/plugin install` defaults to **user scope** (the `adopt` command becomes available
in all your repos). Scope only controls where the bootstrap command is *available* —
it does **not** make the SDLC run automatically. That comes from the files `adopt`
commits into the repo (see [Automatic use](#automatic-use-no-per-session-invocation)).
`/reload-plugins` is required after install before the command works.

| Other methods | Steps |
| --- | --- |
| **Plugin (local clone)** | `git clone https://github.com/eiwe/sfc-sdlc && claude --plugin-dir ./sfc-sdlc`, then `/sdlc:adopt` |
| **Standalone skill** | Copy `skills/adopt/` to `~/.claude/skills/adopt/` (personal) or `.claude/skills/adopt/` (project). Invoke with `/adopt`. |

### Pi

```
# Install the package (once)
pi install git:github.com/eiwe/sfc-sdlc
# Bootstrap a repo (once, from inside that repo)
/skill:adopt
```

| Other methods | Steps |
| --- | --- |
| **Standalone skill** | Copy `skills/adopt/` to `~/.pi/agent/skills/adopt/` (global) or `.pi/skills/adopt/` (project), or run `pi --skill ./skills/adopt`. |

You can also skip the slash command entirely and just say *"adopt the spec-first SDLC
in this repo"* — the `adopt` skill is model-invoked in both harnesses.

> Forking? Replace `eiwe/sfc-sdlc` throughout this README and `docs/COMPATIBILITY.md`,
> and the `homepage`/`repository`/`author` fields in `.claude-plugin/plugin.json`
> and `package.json`, with your own owner/repo.

See [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) for exactly how the layout
maps onto each harness's conventions.

## Automatic use (no per-session invocation)

You do **not** invoke a skill each session. A skill never runs on its own — it is
invoked on demand — so the plugin/skill is only a **one-time bootstrap**, and its
install scope does not change that.

What makes the SDLC apply automatically is what `adopt` writes into your repo:

- **`AGENTS.md`** — Pi loads it into context automatically every session.
- **`CLAUDE.md`** (imports `AGENTS.md`) — Claude Code loads it automatically every
  session and re-injects it from disk after `/compact` and `/clear`.
- **`.claude/settings.json`** hooks — fire automatically at session start.

Once these are **committed** to a repo, every session in that repo — in Claude Code
and Pi, for you and any collaborator — follows the SDLC with nothing to invoke, even
after context compaction. A repo that already has a committed `AGENTS.md`/`CLAUDE.md`
is governed automatically **even with no plugin installed at all**.

## Setting up a repo (one-time)

1. Install the plugin/package once (above).
2. From inside the target repo, run `/sdlc:adopt` (Claude Code) or `/skill:adopt`
   (Pi) — or just ask for it in natural language.
3. It scaffolds `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, `CHANGELOG.md`, `TESTING.md`,
   `REVIEW.md`, `docs/decisions/`, `docs/changes/_template/` (the `intent.md`/`spec.md`/`plan.md`
   chain), the PR template, `.github/CODEOWNERS`, CI, the `.claude/` hooks and subagents, and the
   dependency-free changelog checker.
4. Fill in the real project commands in `AGENTS.md`, then **commit** the files.
5. Enable the GitHub hard gates (branch protection) per [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md).

After that it is automatic — you never invoke `adopt` again in that repo.

## What's in this repo

```
.claude-plugin/plugin.json         Claude Code plugin manifest
.claude-plugin/marketplace.json    Claude Code single-plugin marketplace
package.json                       Pi package manifest (+ npm metadata)
skills/adopt/SKILL.md              The dual-compatible bootstrap skill (/sdlc:adopt)
skills/adopt/templates/            What the skill installs into a target project
skills/adopt/templates/scripts/    Dependency-free changelog format checker
docs/SDLC.md                       The methodology in full
docs/PLAYBOOK_ALIGNMENT.md         Play-by-play mapping to Anthropic's AI-Native SDLC Playbook
docs/GITHUB_WORKFLOW.md            Prescriptive GitHub workflow + hard-gate setup
docs/COMPATIBILITY.md             How this maps to Claude Code and Pi
docs/decisions/                    ADRs for this repo's own decisions
docs/changes/                      This repo's own intent/spec/plan change chain
example/minimal-adoption/          A populated example of an adopted repo
```

## Documents the methodology maintains

| Document | Purpose | Owned by |
| --- | --- | --- |
| `AGENTS.md` | Universal rules, read first every session (source of truth) | Team |
| `CLAUDE.md` | One-line `@AGENTS.md` bridge for Claude Code | Team |
| `docs/changes/<slug>/intent.md` | Problem and desired outcome, in the originator's words | Product owner / human |
| `docs/changes/<slug>/spec.md` | Requirements and design (replaces the old PRD) | Product owner / human |
| `docs/changes/<slug>/plan.md` | Approved implementation plan before code | Engineer / tech lead |
| `docs/decisions/` | Significant architecture/product/design decisions (ADRs) | Team |
| `REVIEW.md` | Review policy: passes, Important vs Nit, do-not-report | Tech lead |
| `CHANGELOG.md` | ISO-dated, concise user-visible changes per release | Team |
| `HANDOFF.md` | Living status for the next session | Last agent to work |
| `.github/pull_request_template.md` | Required review checklist | Process |
| `.github/CODEOWNERS` | Routes agent-configuration files to code-owner review | Process |
| `.claude/agents/` | `verifier` and `reviewer` subagents (Claude Code only) | Team |
| `TESTING.md` | Test policy and the verification feedback loop | Team |

## Alignment with Anthropic's AI-Native SDLC Playbook

This SDLC is a tool-agnostic implementation of Anthropic's
[AI-Native SDLC Playbook](https://claude.com/blog/the-ai-native-sdlc-playbook) (published
2026-08-21). It follows the playbook's six-stage loop (Plan → Design → Build → Test → Deploy →
Maintain) and its committed-artifact chain — `intent.md` → `spec.md` → `plan.md` → the diff and
its tests → a PR with review findings → an incident record — where each stage ends by committing
an artifact the next stage reads. It keeps the playbook's control model: skills advise, hooks and
CI enforce, humans decide at the gates, and the agent acts up to the production boundary and never
past it. On top of that it adds `AGENTS.md` as a cross-harness source of truth (Claude Code and
Pi), ADRs, `HANDOFF.md` with a handoff gate, and the dated changelog contract. The Anthropic-hosted
and managed-settings plays (Claude Security, Claude Tag, managed permissions, continuous evals) are
documented as adopter-enabled rather than shipped. See
[`docs/PLAYBOOK_ALIGNMENT.md`](docs/PLAYBOOK_ALIGNMENT.md) for the play-by-play mapping.

## License

MIT — see [LICENSE](LICENSE).

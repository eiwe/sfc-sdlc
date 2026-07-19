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

### Claude Code

```
# Plugin via marketplace (recommended)
/plugin marketplace add eiwe/sfc-sdlc
/plugin install spec-first-sdlc@sfc-sdlc
# then invoke:
/spec-first-sdlc:spec-first-sdlc
```

| Other methods | Steps |
| --- | --- |
| **Plugin (local clone)** | `git clone https://github.com/eiwe/sfc-sdlc && claude --plugin-dir ./sfc-sdlc` |
| **Standalone skill** | Copy `skills/spec-first-sdlc/` to `~/.claude/skills/spec-first-sdlc/` (personal) or `.claude/skills/spec-first-sdlc/` (project). Invoke with `/spec-first-sdlc`. |

### Pi

```
# Package (recommended)
pi install git:github.com/eiwe/sfc-sdlc
# then invoke:
/skill:spec-first-sdlc
```

| Other methods | Steps |
| --- | --- |
| **Standalone skill** | Copy `skills/spec-first-sdlc/` to `~/.pi/agent/skills/spec-first-sdlc/` (global) or `.pi/skills/spec-first-sdlc/` (project), or run `pi --skill ./skills/spec-first-sdlc`. |

> Forking? Replace `eiwe/sfc-sdlc` throughout this README and `docs/COMPATIBILITY.md`,
> and the `homepage`/`repository`/`author` fields in `.claude-plugin/plugin.json`
> and `package.json`, with your own owner/repo.

See [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) for exactly how the layout
maps onto each harness's conventions.

## Use

1. Install (above), then invoke the skill and ask it to **adopt** the SDLC in your repo.
2. It scaffolds `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, `CHANGELOG.md`, `TESTING.md`,
   `docs/decisions/`, `docs/prd/`, the PR template, CI, and the Claude Code hooks.
3. Fill in the real project commands in `AGENTS.md`.
4. Enable the GitHub hard gates (branch protection) per [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md).

From then on, every session in either harness starts by reading `HANDOFF.md` and
`AGENTS.md`, and every change flows through the decision → spec → implement →
verify → review → handoff phases and their gates.

## What's in this repo

```
.claude-plugin/plugin.json         Claude Code plugin manifest
.claude-plugin/marketplace.json    Claude Code single-plugin marketplace
package.json                       Pi package manifest (+ npm metadata)
skills/spec-first-sdlc/SKILL.md    The dual-compatible skill (bootstrap + rules)
skills/spec-first-sdlc/templates/  What the skill installs into a target project
docs/SDLC.md                       The methodology in full
docs/GITHUB_WORKFLOW.md            Prescriptive GitHub workflow + hard-gate setup
docs/COMPATIBILITY.md             How this maps to Claude Code and Pi
example/minimal-adoption/          A populated example of an adopted repo
```

## Documents the methodology maintains

| Document | Purpose | Owned by |
| --- | --- | --- |
| `AGENTS.md` | Universal rules, read first every session (source of truth) | Team |
| `CLAUDE.md` | One-line `@AGENTS.md` bridge for Claude Code | Team |
| `docs/prd/` | What we are building and why (PRDs) | Product owner / human |
| `docs/decisions/` | Significant architecture/product/design decisions (ADRs) | Team |
| `CHANGELOG.md` | User-visible changes per release | Team |
| `HANDOFF.md` | Living status for the next session | Last agent to work |
| `.github/pull_request_template.md` | Required review checklist | Process |
| `TESTING.md` | Test policy and requirements | Team |

## License

MIT — see [LICENSE](LICENSE).

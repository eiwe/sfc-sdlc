# Spec-First Collaborative SDLC

A document-driven software development lifecycle designed for projects built by one or more humans collaborating with AI agents (Claude Code, Pi, Kimi K3, etc.).

The core idea: **requirements and decisions are written before code, and every session starts by reading the context that came before it.** This makes the project durable, reviewable, and portable across agents.

## What this gives you

- A repeatable process from idea → decision → spec → implementation → review → handoff.
- A small set of documents that agents can read at the start of every session.
- Prescriptive GitHub workflow with mandatory gates.
- Explicit requirement for a test suite.
- A changelog and handoff discipline so work does not get lost between sessions.

## Documents in this system

| Document | Purpose | Owned by |
| --- | --- | --- |
| `AGENTS.md` | Universal rules every agent reads first | Team |
| `PRD.md` (in `docs/prd/` or `docs/specs/`) | What we are building and why | Product owner / human |
| `ADR.md` (in `docs/decisions/`) | Significant architecture/product/design decisions | Team |
| `CHANGELOG.md` | User-visible changes per release | Team |
| `HANDOFF.md` | Living status for the next session | Last agent to work |
| `.github/pull_request_template.md` | Required review checklist | Process |
| `TESTING.md` | Test suite requirements | Team |

## Quick adoption

1. Copy `templates/` into your repo root.
2. Read `SDLC.md` and `GITHUB_WORKFLOW.md`.
3. Fill in `AGENTS.md` with your project’s rules.
4. Start every session by reading `HANDOFF.md`, then `AGENTS.md`.

## Naming

This methodology is intentionally generic. Call it whatever fits your team: Spec-First SDLC, Document-Driven AI Development, or just “how we work here.”

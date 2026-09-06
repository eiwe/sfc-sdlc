# Intent: Autonomous, portable SDLC teams

**Author:** Eiwe (request in this conversation)
**Status:** Accepted
**Date:** 2026-09-05

## Problem and outcome

"I want this repo to be able to enforce the sdlc for a competent team of subagents
that may have various personas as in a human development team."

Support Claude Code, Codex, Pi, and OpenCode using the same committed artifacts,
independent review and verification, and bounded autonomous progression. Humans
intervene only for explicit escalations. Keep the implementation lean and aligned
with the AI-Native SDLC playbook's artifact chain and control objectives.

## Authorization and constraints

The user explicitly requested autonomous implementation and spawned agents, and
asked us to trial the method on this change. This authorizes modifying this repo's
workflow controls for this implementation. Preserve the existing README edits.
No production deployment, credential provisioning, or live branch-protection change
is authorized. Keep the shared runtime dependency-free; models are configurable.
Distinguish locally cooperative guardrails from controls deployed outside worker
write access. Do not claim live harness compatibility from fixture tests alone.

## Acceptance of intent

Accepted through the user's explicit implementation request on 2026-09-05.
The independent design review will gate implementation; no repeated human approval
is required for the agreed scope.

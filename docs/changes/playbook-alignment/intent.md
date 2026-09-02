# Intent: align the SDLC with Anthropic's AI-Native SDLC Playbook

- **Author:** project owner (Eiwe)
- **Status:** Accepted
- **Date:** 2026-09-02
- **Tracker:** ADR [`0002-align-with-ai-native-sdlc-playbook`](../../decisions/0002-align-with-ai-native-sdlc-playbook.md)

## Problem

Anthropic published the AI-Native SDLC Playbook on 2026-08-21. This project already scaffolds a
document-driven SDLC, but it does not match the playbook's committed-artifact chain or its control
model. There is no captured intent and no committed implementation plan, no written review policy,
no production action boundary distinct from the merge gates, and none of the feedback-loop rules
(single-command verification, failing-test-first bug fixes, protecting the test from the agent
fixing the code). Adopters who read the playbook cannot see how this SDLC maps onto it or where it
deliberately differs.

## Proposed outcome

This SDLC becomes a faithful, tool-agnostic implementation of the playbook's six stages and
artifact chain, while keeping what it adds on top (`AGENTS.md` as cross-harness source of truth,
ADRs, `HANDOFF.md`, the dated changelog contract, GitHub-side enforcement). A reader can map every
playbook play to a file, hook, or doc here, and see honestly what is out of scope.

## Affected users and systems

Adopters of the SDLC in both Claude Code and Pi; the `/sdlc:adopt` payload; the methodology docs;
the plugin/package manifests; the worked example.

## Constraints

- Keep it tool-agnostic: Claude Code-only pieces (hooks, subagents, plan mode) must be labeled,
  with GitHub branch protection and CI as the shared enforcement.
- Represent the playbook accurately; do not invent claims about it.
- Keep versions at 0.1.0; keep `AGENTS.md` close to one page.
- Existing adopters must keep working; a `docs/prd/*.md` file stays a valid spec.

## Open questions

None outstanding. The change folder replaces `docs/prd/`; the source-of-truth choice per artifact
(repo vs. legacy tracker) is left to the adopter, as the playbook recommends.
</content>

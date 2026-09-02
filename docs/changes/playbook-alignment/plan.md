# Plan: align the SDLC with Anthropic's AI-Native SDLC Playbook

- **Status:** Approved
- **Date:** 2026-09-02
- **Approved by:** project owner (Eiwe)
- **Spec:** [`spec.md`](spec.md)

## Files that change

Documentation and metadata (this stream):

- `docs/SDLC.md` (restructured), `docs/PLAYBOOK_ALIGNMENT.md` (new),
  `docs/GITHUB_WORKFLOW.md`, `docs/COMPATIBILITY.md`.
- `docs/decisions/0002-align-with-ai-native-sdlc-playbook.md` (new).
- `docs/changes/playbook-alignment/{intent,spec,plan}.md` (new; this chain).
- `docs/prd/dated-concise-changelogs.md` → `docs/changes/dated-concise-changelogs/spec.md`
  (`git mv`, H1 retitled); `docs/prd/` removed.
- `README.md`, `package.json`, `.claude-plugin/plugin.json`.

Payload and tests (concurrent stream, to the same design):

- `skills/adopt/**` (templates `INTENT.md`, `SPEC.md`, `PLAN.md`, `REVIEW.md`, `CODEOWNERS`, the
  two new hooks, two subagents; `SKILL.md`), `tests/**`, `example/**`.

## Order of work

1. Read the playbook and the design in full; read every file in scope.
2. `git mv` the PRD to the change folder and retitle its H1.
3. Restructure `docs/SDLC.md`; write `PLAYBOOK_ALIGNMENT.md`.
4. Update `GITHUB_WORKFLOW.md` and `COMPATIBILITY.md`.
5. Write ADR-0002 and this dogfooded chain.
6. Update `README.md` and the two manifests.
7. Grep for residual `docs/prd`/`PRD` references and reconcile.

## Risks

- **What could break:** references to `docs/prd/` or "PRD" left dangling after the move; the
  documented payload paths drifting from what the concurrent stream actually ships.
- **Riskiest step:** keeping the documentation's hook names, env vars, and installed paths exactly
  in sync with the payload stream — a mismatch would mislead adopters. Mitigation: both streams
  follow the same design spec verbatim (fixed names and paths).
- **Options not taken:** doing docs and payload in one pass (rejected: parallelizable, and the
  design fixes the contract between them); adding `docs/intent/` + `docs/plans/` beside
  `docs/prd/` (rejected in ADR-0002).

## Proof

- `wc -l docs/SDLC.md` reports ≤ 300.
- `grep -rn "docs/prd\|PRD" README.md docs/ package.json .claude-plugin/` returns only justified
  historical mentions (ADR-0001, the moved spec's `Decision:` link, and ADR-0002's rename
  explanation).
- `docs/prd/` no longer exists; `docs/changes/dated-concise-changelogs/spec.md` exists with the
  retitled H1 and the original body.
- Manifests parse as JSON, keep `"version": "0.1.0"`, and contain the `ai-native-sdlc` and
  `playbook` keywords.

## Deviations

None.
</content>

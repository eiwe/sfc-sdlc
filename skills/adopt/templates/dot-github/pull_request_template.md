## Summary

<!-- What changed and why. Link the change folder and any ADR this implements. -->

## Verification

<!-- Paste what was actually run: build, tests, lint/type-check, manual/live checks, with results.
     "It compiles" is not verification. -->

## Gate checklist

- [ ] **Intent** — links to `docs/changes/<slug>/intent.md` (accepted), or `trivial: not needed`.
- [ ] **Decision** — significant decision has an ADR under `docs/decisions/` (or a superseding ADR that cites the superseded ID), or not needed.
- [ ] **Spec** — links to `docs/changes/<slug>/spec.md` (accepted, flagged concerns resolved), or `trivial: not needed`.
- [ ] **Plan** — links to `docs/changes/<slug>/plan.md`; the diff matches it, or `plan.md` records the deviation.
- [ ] **Test** — verification output pasted above; tests added for new behavior and bug fixes.
- [ ] **Review** — `REVIEW.md` passes were run (human and/or AI) and Important findings resolved.
- [ ] **AGENTS.md** — "Things agents get wrong" updated if a mistake repeated (twice rule), or N/A.
- [ ] **Handoff** — dated, concise `CHANGELOG.md` entry added under the matching Unreleased category, and `HANDOFF.md` updated with the anticipated post-merge state.

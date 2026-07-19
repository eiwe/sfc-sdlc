# GitHub Workflow

This is the prescriptive GitHub workflow for the Spec-First Collaborative SDLC. Projects adopting this methodology must follow it.

## Branches

- **Default branch:** `main` or `master`.
- **Feature branches:** created from default branch for every change.
- **Branch naming:** `feat/description`, `fix/description`, `docs/description`, `security/description`, `refactor/description`. Use kebab-case and be specific.

## Commits

Use conventional commits:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `test:` — adding or updating tests
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `security:` — security fix or improvement
- `chore:` — maintenance, tooling, dependencies

Keep commits focused and atomic. A PR should tell a clear story when read commit-by-commit.

## Pull requests

Every change is reviewed via pull request. No direct pushes to the default branch.

### PR description

Must use the project pull request template. At minimum it must contain:

- **Summary:** what changed and why.
- **Verification:** the exact commands or checks run, and their results. "It compiles" is not enough.
- **Context checklist:** confirming AGENTS.md/CLAUDE.md, ADRs, and CHANGELOG were considered.

### Required checks

- Test suite passes.
- Static checks pass (lint, type check, compile) if configured.
- Secret scan passes if configured.
- At least one review approval.

### Review process

1. Author opens PR and fills the template.
2. Author verifies the branch locally or via CI.
3. Reviewer reads the PR, the linked PRD/ADR, and the relevant code.
4. Reviewer may request changes or approve.
5. On approval, author squashes or merges according to project convention.

Adversarial review: for non-trivial changes, ask an independent agent or human reviewer to verify assumptions, look for drift, and confirm tests cover the change.

## Merging

- Use **squash merge** for feature branches with many small commits.
- Use **merge commit** for long-lived branches or when preserving history matters.
- Delete feature branches after merge.

## Releases

- Maintain `CHANGELOG.md` under an Unreleased section during development.
- When releasing, add a version and date header above the accumulated changes.
- Tag the release commit: `git tag -a v1.2.3 -m "Release 1.2.3"`.

## Document changes

Treat context documents (`AGENTS.md`, `CLAUDE.md`, ADRs, PRDs, `TESTING.md`) as code:

- Changes to them require a PR.
- Significant process changes require a decision record.
- Context drift is a bug: if docs no longer match behavior, fix the docs or the behavior.

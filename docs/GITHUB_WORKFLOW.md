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
- **Handoff evidence:** a dated concise changelog entry and anticipated post-merge
  handoff state, or explicit N/A reasons.

### Required checks

- Test suite passes.
- Static checks pass (lint, type check, compile) if configured.
- `node scripts/check-changelog.mjs CHANGELOG.md` passes.
- Secret scan passes if configured.
- At least one review approval.

### Review process

1. Author opens PR and fills the template.
2. Author verifies the branch locally or via CI.
3. Reviewer reads the PR, the linked PRD/ADR, the relevant code, and the dated
   changelog entry.
4. Reviewer may request changes or approve.
5. On approval, author squashes or merges according to project convention.

Adversarial review: for non-trivial changes, ask an independent agent or human reviewer to verify assumptions, look for drift, and confirm tests cover the change.

## Enforcing the gates (setup)

Context files are guidance, not law — both Claude Code and Pi can ignore them. Make
the gates real with platform-side enforcement, which works regardless of harness or OS.

**GitHub branch protection / ruleset** on the default branch — require a PR, block
direct pushes, require an approving review and passing CI:

```bash
# Requires: gh CLI, authenticated, admin on the repo. Replace OWNER/REPO and main.
gh api -X PUT repos/OWNER/REPO/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -F "required_pull_request_reviews[required_approving_review_count]=1" \
  -F "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=verify" \
  -F "enforce_admins=true" \
  -F "restrictions=null"
```

**CI** — the shipped `.github/workflows/ci.yml` provides the `verify` (test gate)
and `secret-scan` jobs; wire in the project's real build/test/lint commands so the
required status check is meaningful.

**Client-side (Claude Code)** — the shipped `.claude/settings.json` adds a
`SessionStart` reminder and a `PreToolUse` guard (`.claude/hooks/guard-push.mjs`)
that blocks `git push` to a protected branch. This is a best-effort convenience;
branch protection is the real gate. Override an approved push with
`SDLC_ALLOW_PUSH_MAIN=1`.

## Merging

- Use **squash merge** for feature branches with many small commits.
- Use **merge commit** for long-lived branches or when preserving history matters.
- Delete feature branches after merge.

## Releases

- Maintain one set of Keep a Changelog categories under `Unreleased` during
  development. Every entry is ISO-dated, concise, newest first in its category,
  and linked to a durable record; see `SDLC.md` for the full contract.
- When releasing, add a version and date header above the accumulated changes.
- Tag the release commit: `git tag -a v1.2.3 -m "Release 1.2.3"`.

## Document changes

Treat context documents (`AGENTS.md`, `CLAUDE.md`, ADRs, PRDs, `TESTING.md`) as code:

- Changes to them require a PR.
- Significant process changes require a decision record.
- Context drift is a bug: if docs no longer match behavior, fix the docs or the behavior.

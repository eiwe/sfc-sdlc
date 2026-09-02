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

- **Change folder:** a link to `docs/changes/<slug>/` (`intent.md`, `spec.md`, `plan.md`), or
  "not needed" recorded for each gate a trivial change skips.
- **Summary:** what changed and why.
- **Verification:** the exact commands or checks run, and their results. "It compiles" is not enough.
- **Context checklist:** confirming AGENTS.md/CLAUDE.md, the change folder, ADRs, and CHANGELOG
  were considered.
- **Handoff evidence:** a dated concise changelog entry and anticipated post-merge
  handoff state, or explicit N/A reasons.

### Required checks

- Test suite passes.
- Static checks pass (lint, type check, compile) if configured.
- `node scripts/check-changelog.mjs CHANGELOG.md` passes.
- Secret scan passes if configured.
- At least one approving review from a **code owner**.

### Review process

Reviewers apply the passes in `REVIEW.md` (bugs; security; compliance against `spec.md`,
`plan.md`, the ADRs, and `AGENTS.md`), tagging each finding as Important or Nit within the nit cap.

1. Author opens PR and fills the template, linking `docs/changes/<slug>/`.
2. Author verifies the branch locally or via CI and pastes the output.
3. A reviewer (human, the `reviewer` subagent, or both) runs the `REVIEW.md` passes against
   `git diff <default-branch>...HEAD` and reads the change folder and the dated changelog entry.
4. Important findings are resolved; the reviewer may request changes or approve.
5. A **human code owner** approves. Findings from any AI review do not approve or block on their
   own — branch protection still requires the code owner's approval.
6. On approval, author squashes or merges according to project convention.

**Optional AI review.** Adopters may enable Claude Code's Code Review service or run
`claude-code-action` in CI to post the `REVIEW.md` passes automatically. When a reviewer or the
author tags `@claude` on a review comment, Claude addresses it and pushes the fix; the PR thread
records both the request and the change. The human code owner remains the approver, and review
findings that recur feed back into `AGENTS.md`.

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
  -F "required_pull_request_reviews[require_code_owner_reviews]=true" \
  -F "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=verify" \
  -F "enforce_admins=true" \
  -F "restrictions=null"
```

`require_code_owner_reviews=true` means the review gate is only satisfied by an approval from a
code owner named in `.github/CODEOWNERS`. This preserves separation of duties: the agent that
wrote the code has no route to approve it.

**CI** — the shipped `.github/workflows/ci.yml` provides the `verify` (test gate)
and `secret-scan` jobs; wire in the project's real build/test/lint commands so the
required status check is meaningful.

**Client-side (Claude Code)** — the shipped `.claude/settings.json` registers four
`.claude/hooks/` guards. `session-reminder.mjs` (SessionStart) reminds the agent to read
`HANDOFF.md` → `AGENTS.md` → the active change folder before acting. Three `PreToolUse` guards
run as a best-effort convenience; branch protection and CI are the real gates:

- `guard-push.mjs` blocks `git push` to a protected branch. Override an approved push with
  `SDLC_ALLOW_PUSH_MAIN=1` (or set `SDLC_PROTECTED_BRANCHES`).
- `guard-production.mjs` blocks a command that looks like a production deploy/write unless
  `SDLC_RELEASE_APPROVAL=<approver or ticket>` is set (or tune detection with
  `SDLC_PRODUCTION_PATTERN`). This is the production boundary.
- `guard-tests.mjs` blocks edits to test files while `SDLC_PROTECT_TESTS=1` is set during a bug
  fix, so the agent fixes the code and not the test. Override for a session with
  `SDLC_ALLOW_TEST_EDIT=1` (or tune with `SDLC_TEST_PATTERN`).

Hooks read the environment Claude Code was launched with, so a human sets these variables when
starting the session (for example `SDLC_PROTECT_TESTS=1 claude`); the agent cannot set them from
inside a command. These hooks and the `verifier`/`reviewer` subagents are Claude Code-only; GitHub branch protection
and CI are the shared, harness-independent enforcement. See
[`COMPATIBILITY.md`](COMPATIBILITY.md).

## CODEOWNERS

The shipped `.github/CODEOWNERS` routes review of the files that steer agents to named code
owners: `AGENTS.md`, `CLAUDE.md`, `REVIEW.md`, `.claude/**`, and `docs/decisions/**`. Combined
with `require_code_owner_reviews=true`, a change to agent configuration cannot merge without a code
owner's approval. Fill in the real owner handles when adopting.

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

## Agent configuration is code

The files that steer agents (`AGENTS.md`, `CLAUDE.md`, `REVIEW.md`, skills, hooks, subagents, and
the intent/spec/plan artifacts) are code:

- Changes to them go through a PR and require a code owner's approval (see CODEOWNERS above).
- Significant process changes require a decision record (ADR).
- Context drift is a bug: if docs no longer match behavior, fix the docs or the behavior.

**Optional agent-evals workflow.** Because that configuration steers the agent, it deserves the
regression testing code gets. Adopters can run an eval suite on any change to it:

```yaml
name: Agent evals
on:
  pull_request:
    paths: ['AGENTS.md', 'CLAUDE.md', 'REVIEW.md', '.claude/**']
  schedule:
    - cron: '0 2 * * *'
```

The suite runs the collected tasks non-interactively (for example via `claude -p`) and gates the
merge on the pass rate. No eval suite ships with this SDLC; the workflow shape is from the
playbook's `agent-evals.yml` example. See [`PLAYBOOK_ALIGNMENT.md`](PLAYBOOK_ALIGNMENT.md).

# Review instructions

The review policy for this repo. Applied to every PR by human reviewers, by the
`reviewer` subagent (`.claude/agents/reviewer.md`, Claude Code), and by AI review
(Claude Code Code Review or `claude-code-action`) where enabled. Findings inform the
decision but do not approve or block on their own — a human code owner approves through
branch protection.

## Passes

Run these passes over the diff (`git diff <default-branch>...HEAD`) and tag each
finding with its pass:

- **Bugs** — logic errors, broken edge cases, subtle regressions.
- **Security** — injection risks, authentication/authorization gaps, PII in logs, secrets in the diff.
- **Compliance** — the diff matches `spec.md`, `plan.md`, the relevant ADRs, and `AGENTS.md`.
  Flag any deviation from `plan.md` that `plan.md` does not record, and flag when the change
  makes `AGENTS.md` stale.

## What Important means here

Reserve **Important** for findings that would break behavior, leak data, or breach a
policy. Style, naming, and preference are **Nits**.

## Cap the nits

Report at most five nits per review; summarize the rest as a count.

## Do not report

Generated paths and anything CI already enforces (format, lint, the changelog check).

## Fix branches

On `fix/*` branches, flag any change to an existing test — a bug fix proves itself
against the test written first, so the test must not be weakened to make it pass.

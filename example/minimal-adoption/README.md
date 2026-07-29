# Minimal adoption example

A worked example of a small project (`notekeep`, a fictional Python CLI) after
adopting the Spec-First Collaborative SDLC. It shows the files the skill installs,
filled in with real content rather than placeholders.

```
AGENTS.md                     # filled-in source of truth
CLAUDE.md                     # @AGENTS.md bridge
HANDOFF.md                    # filled-in living status
CHANGELOG.md
docs/decisions/0001-use-sqlite-for-storage.md
docs/prd/tagging.md
```

Not shown here (identical to the templates): `TESTING.md`,
`.github/pull_request_template.md`, `.github/workflows/ci.yml`,
`.claude/settings.json`, `.claude/hooks/guard-push.mjs`,
`.claude/hooks/session-reminder.mjs`, and `scripts/check-changelog.mjs`.

## First session on this repo

1. Read `HANDOFF.md`, then `AGENTS.md`.
2. Pick up the top priority from `HANDOFF.md` (here: finish the `tag` command).
3. Since it's covered by `docs/prd/tagging.md`, implement against those acceptance criteria.
4. Add tests, open a PR with the template, then add the dated concise changelog
   entry and anticipated post-merge handoff state before review.

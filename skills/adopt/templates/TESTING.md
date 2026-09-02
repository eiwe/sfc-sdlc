# Testing Policy

A test suite is **required**. No change that introduces new behavior or fixes a
bug may be merged without appropriate test coverage. This is the test gate.

## The feedback loop

Give the agent a way to check its own work before a human sees it.

- Wrap the check in a **single command that exits non-zero on failure** (for example
  `make test` or `npm test`). If checking the work takes a sequence of commands today,
  wrap them in one target.
- List that command in the **Commands** section of `AGENTS.md` with an example of its
  **healthy output**, so the agent can judge the result without asking.
- State a **quantifiable target** so success is unambiguous — "all tests pass", "the
  endpoint returns 200 with the new field", "coverage does not drop".
- For **UI work**, close the loop with a **visual check**: give the agent a screenshot or
  browser tool and the mock, and let it implement, screenshot, compare, and adjust.

## Required tests

- **Unit tests** for pure functions and business logic.
- **Integration tests** for data access and external adapters where feasible.
- **Regression tests** for every fixed bug.

## Fixing bugs

Write the failing test first. It is the proof the bug is gone.

1. Reproduce the bug as a test. Run it and **confirm it fails for the reason you expect**.
2. **Commit that test.**
3. Start the fix session with `SDLC_PROTECT_TESTS=1` in its environment (for example
   `SDLC_PROTECT_TESTS=1 claude`), then fix the code **without touching the test** — the
   `guard-tests.mjs` hook blocks test edits while it is set. Hooks read the environment the
   harness was launched with, so the variable cannot be set from inside the session.
4. `SDLC_ALLOW_TEST_EDIT=1` (set the same way) is the documented escape hatch, for when the
   test itself was wrong and a human agreed. Use it only then.

## Test data

- Tests must not depend on production data or live external services unless explicitly approved.
- Use in-memory databases, mocks, fixtures, or synthetic data.

## Running tests

<!-- Exact command(s). Must match the "Commands" section of AGENTS.md and .github/workflows/ci.yml. -->

```bash
# Example:
# pytest -q
```

The changelog format check is always available independently of the project
toolchain:

```bash
node scripts/check-changelog.mjs CHANGELOG.md
```

## Verification is part of done

Run the build, the test suite, and the lint/type-check **before reporting a task
complete, and paste the output** into the PR. "It compiles" is not verification;
evidence comes from the toolchain. If a test fails, **fix the code, not the test.**

## CI expectations

- The test suite must pass before merge (enforced by CI + branch protection).
- New code should not reduce overall coverage without justification.
- The changelog checker must pass even for documentation-only changes.

## What does not need tests

- Pure configuration changes.
- Documentation-only changes.
- Throwaway prototypes explicitly marked as experimental.

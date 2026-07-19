# Testing Policy

A test suite is **required**. No change that introduces new behavior or fixes a
bug may be merged without appropriate test coverage. This is the test gate.

## Required tests

- **Unit tests** for pure functions and business logic.
- **Integration tests** for data access and external adapters where feasible.
- **Regression tests** for every fixed bug.

## Test data

- Tests must not depend on production data or live external services unless explicitly approved.
- Use in-memory databases, mocks, fixtures, or synthetic data.

## Running tests

<!-- Exact command(s). Must match the "Commands" section of AGENTS.md and .github/workflows/ci.yml. -->

```bash
# Example:
# pytest -q
```

## CI expectations

- The test suite must pass before merge (enforced by CI + branch protection).
- New code should not reduce overall coverage without justification.

## What does not need tests

- Pure configuration changes.
- Documentation-only changes.
- Throwaway prototypes explicitly marked as experimental.

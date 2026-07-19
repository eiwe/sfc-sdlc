# Testing Policy

A test suite is **required** for this project. No change that introduces new behavior or fixes a bug may be merged without appropriate test coverage.

## Required tests

- **Unit tests** for pure functions and business logic.
- **Integration tests** for data access and external adapters where feasible.
- **Regression tests** for every fixed bug.

## Test data

- Tests must not depend on production data or live external services unless explicitly approved.
- Use in-memory databases, mocks, fixtures, or synthetic data.

## Running tests

<!-- Exact command(s). -->

```bash
# Example:
# pytest -q
```

## CI expectations

- The test suite must pass before merge.
- New code should not reduce overall coverage without justification.

## What does not need tests

- Pure configuration changes.
- Documentation-only changes.
- Throwaway prototypes explicitly marked as experimental.

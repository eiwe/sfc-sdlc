# Changelog

## [Unreleased]

### Added

- `2026-09-05` **Portable autonomous SDLC teams.** Added shared independent gates,
  bounded repairs, revision-bound evidence and Claude Code, Codex, Pi and OpenCode adapters.
  ([ADR-0003](docs/decisions/0003-autonomous-portable-sdlc.md))
- `2026-09-05` **Safe repeatable adoption.** Added preview, configuration-preserving upgrades
  and a doctor that reports incomplete setup. ([ADR-0003](docs/decisions/0003-autonomous-portable-sdlc.md))

### Fixed

- `2026-09-05` **Fail-closed workflow evidence.** Missing CI commands, stale decisions,
  hidden changes and interrupted integration cannot silently advance the workflow.
  ([ADR-0003](docs/decisions/0003-autonomous-portable-sdlc.md))

### Known issues

- `2026-09-05` **Authoritative autonomy needs host controls.** Local runs remain cooperative;
  live provider certification, isolated workers and trusted platform integration need operator setup.
  ([ADR-0003](docs/decisions/0003-autonomous-portable-sdlc.md))

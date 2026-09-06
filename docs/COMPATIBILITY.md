# Compatibility

One artifact contract supports Claude Code, Codex, Pi and OpenCode. The controller
is independent of model names: choose a model supported by each configured provider.
Astra, Opus, Sonnet or other personas do not change stage evidence or authority.
The shipped interfaces target current primary documentation checked 2026-09-05;
fixture coverage and live certification are separate claims.

## Discovery and integration

| Concern | Claude Code | Codex | Pi | OpenCode |
| --- | --- | --- | --- | --- |
| Standing rules | `CLAUDE.md` importing `@AGENTS.md` | `AGENTS.md` | `AGENTS.md` | `AGENTS.md` |
| Shared skill | Existing plugin or `.claude/skills/adopt/` | `.agents/skills/adopt/` | Package or `.agents/skills/adopt/` | `.agents/skills/adopt/` |
| Invoke bootstrap | `/sdlc:adopt` or `/adopt` | `$adopt` or `/skills` | `/skill:adopt` | Ask to load `adopt` |
| Local guard adapter | `.claude/settings.json`, `.claude/hooks/` | `.codex/hooks.json` | `.pi/extensions/sdlc.ts` | `.opencode/plugins/sdlc.js` |
| Controller bridge | `runner.mjs --harness claude` | `runner.mjs --harness codex` | `runner.mjs --harness pi` | `runner.mjs --harness opencode` |

Copy the whole inner `skills/adopt/` directory for standalone discovery, including
its scripts and templates. Install one canonical copy per scope; overlapping skill
locations can expose duplicate names. Codex, Pi and OpenCode document the shared
`.agents/skills/` location. [Codex skills](https://learn.chatgpt.com/docs/build-skills),
[Pi skills](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md),
[OpenCode skills](https://opencode.ai/docs/skills/)

Claude loads the shared rules through its supported import bridge. Other harnesses
load project instruction files with their own precedence and trust settings;
nested overrides can affect the effective instructions.
[Claude memory](https://code.claude.com/docs/en/memory#agentsmd),
[Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[Pi project context](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md),
[OpenCode rules](https://opencode.ai/docs/rules/)

The existing Claude plugin and Pi package installation methods remain available:

```text
Claude: /plugin marketplace add eiwe/sfc-sdlc
        /plugin install sdlc@sfc-sdlc
        /reload-plugins
Pi:     pi install git:github.com/eiwe/sfc-sdlc
```

## Runtime and roles

The installer copies shared `scripts/sdlc/{controller,guards,hooks,runner}.mjs` and
the runner response schema. See the installed
[WORKFLOW.md](../skills/adopt/templates/WORKFLOW.md) for the JSON protocol, policy,
limits, commands, evidence and trust boundary. The bridge launches fresh native
processes, optionally using `--model`; operator wrappers configure permissions,
provider access and task-scoped personas. It does not bypass native approvals,
sandboxing or project trust.

Shared [ROLES.md](../skills/adopt/templates/ROLES.md), REVIEW.md and TESTING.md
define role procedures. The included Claude reviewer/verifier definitions are
optional native conveniences. Cross-provider teamwork uses configured runner
commands; a native subagent facility does not imply access to another provider.

## Guard coverage

Shared normalization handles Claude Bash/PowerShell and file-edit events, Codex
Bash/apply_patch including all patch and move paths, Pi bash/edit/write events, and
OpenCode tool events. The native adapters translate blocking results; policy lives
in the shared implementation. Current extension points are documented by
[Claude hooks](https://code.claude.com/docs/en/hooks),
[Codex hooks](https://learn.chatgpt.com/docs/hooks),
[Pi extensions](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md)
and [OpenCode plugins](https://opencode.ai/docs/plugins/).

Trust newly installed project hooks/extensions through each harness's native
mechanism. In Codex inspect `/hooks`; enable `features.hooks` if that feature is
disabled. Pi also requires trusted project configuration. Installation does not
grant those permissions.

Command-pattern checks are limited assistance. Unknown tools have unknown coverage;
shell writes can bypass editor-path guards, and shell text cannot reliably reveal
the current infrastructure target. The production acknowledgment, when configured,
must bind the exact command, cwd, expiry and reference; it remains unauthenticated
local configuration. A legacy ticket string is not accepted as proof. Actual
production authorization belongs to scoped credentials and deployment controls.

## Resume and validation tiers

Read HANDOFF.md, AGENTS.md, the active change artifacts and controller state on every
resume or compaction. Rules on disk and durable controller state can be read across
harnesses. They do not guarantee that a model will obey instructions or automatically
reload every modified file at the same point in each harness.

| Tier | What it establishes | Status in this package |
| --- | --- | --- |
| Protocol fixtures | Normalization, native callback results, runner parsing and controller semantics | Automated Node tests |
| Cooperative local trial | Distinct role executions and artifact/evidence progression under one user | Test and trial records |
| Live harness/provider | Actual CLI, skill, hook, resume and model behavior for recorded versions | Must be run for the intended configuration |
| Authoritative deployment | Workers cannot edit controls/evidence or access merge/production credentials | Operator host/platform setup and validation |

Before claiming live support, run fresh adoption, preserved existing configuration,
read-only review, a small task, a regression fix, interrupted/resumed work and an
explicit escalation in that harness. Transfer one active task to another harness
using the durable records. Record actual versions and results; availability or
agreement of particular models is not a certification.

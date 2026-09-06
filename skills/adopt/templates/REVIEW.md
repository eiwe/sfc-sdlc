# Review policy

An independent reviewer evaluates the submitted revision and reports findings.
Read `AGENTS.md`, the active intent/spec/plan, relevant ADRs and verification
evidence. The controller owns the gate decision record; Markdown status and model
agreement are not proof. Reviewers do not change the submission or approve their
own implementation. Follow `ROLES.md` and `WORKFLOW.md` for role and trust boundaries.

## Passes

- **Correctness:** requirements, logic, edge cases, regression risk and neighboring flows.
- **Security:** permissions, untrusted inputs, credentials, data exposure and control bypasses.
- **Compliance:** accepted scope, plan deviations, significant ADRs, test evidence,
  production boundaries and accurate user-facing compatibility claims.

Reserve **Important** for behavior, security or policy failures. Give each finding
a concrete trigger, consequence and file/reference. Resolve Important findings
before advancing. Report at most five **Nits**; summarize additional nits by count.
Do not repeat purely mechanical formatting findings already enforced by CI.

For planning gates, test the artifact against its accepted inputs and challenge
missing acceptance criteria, authority assumptions and unbounded work. Return
`advance`, `revise` with actionable findings, or `escalate` with the named policy
condition and decision needed. A routine revision belongs with the producing agent.

For bug fixes, examine the failing regression commit and final test changes,
including deletions, moves and shell-written edits. A corrected invalid test needs
independent acceptance and renewed failing evidence, not an unexplained override.

All implementation and handoff changes precede final review. Changed inputs or a
changed revision invalidate affected evidence. Platform policy controls whether
an accepted agent review enables integration or needs an accountable human review.

import assert from "node:assert/strict";
import test from "node:test";

import { validateChangelog } from "../skills/adopt/templates/scripts/check-changelog.mjs";

const valid = `# Changelog

## [Unreleased]

### Added

- \`2026-07-29\` **Public landing page.** Visitors now see a concise product introduction.
  ([PR #248](https://github.com/example/project/pull/248))

### Known issues

- \`2026-07-29\` **Two-week plans may stop after week one.** Investigation is open. (#249)

## [1.0.0] - 2026-07-28

### Added

- Initial release.
`;

test("accepts the dated concise format", () => {
  assert.deepEqual(validateChangelog(valid), []);
});

test("rejects duplicate categories", () => {
  const input = valid.replace("### Known issues", "### Added");
  assert.match(validateChangelog(input).join("\n"), /duplicate Unreleased category 'Added'/);
});

test("rejects missing and invalid dates", () => {
  const missing = valid.replace("`2026-07-29` **Public", "**Public");
  assert.match(validateChangelog(missing).join("\n"), /must start with `YYYY-MM-DD`/);

  const invalid = valid.replace("`2026-07-29` **Public", "`2026-02-30` **Public");
  assert.match(validateChangelog(invalid).join("\n"), /not a valid ISO calendar date/);
});

test("rejects entries over 100 words", () => {
  const words = Array.from({ length: 101 }, () => "word").join(" ");
  const input = valid.replace(
    "Visitors now see a concise product introduction.",
    `${words}.`,
  );
  assert.match(validateChangelog(input).join("\n"), /maximum is 100/);
});

test("rejects entries without durable references", () => {
  const input = valid.replace(
    "([PR #248](https://github.com/example/project/pull/248))",
    "No reference.",
  );
  assert.match(validateChangelog(input).join("\n"), /needs a PR, issue, ADR/);
});

test("rejects lines over 120 characters", () => {
  const input = valid.replace(
    "Visitors now see a concise product introduction.",
    "A".repeat(121),
  );
  assert.match(validateChangelog(input).join("\n"), /line exceeds 120 characters/);
});

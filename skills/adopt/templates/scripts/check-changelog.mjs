#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_CATEGORIES = new Set([
  "Added",
  "Changed",
  "Deprecated",
  "Removed",
  "Fixed",
  "Security",
  "Known issues",
]);

const MAX_LINE_LENGTH = 120;
const MAX_ENTRY_WORDS = 100;

function validIsoDate(value) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf())
    && parsed.toISOString().slice(0, 10) === value;
}

function wordCount(value) {
  return value
    .replace(/\[[^\]]+\]\([^)]+\)/g, " link ")
    .replace(/[`*_>#()[\]{}]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

export function validateChangelog(text, filename = "CHANGELOG.md") {
  const lines = text.split(/\r?\n/);
  const errors = [];
  const addError = (line, message) => {
    errors.push(`${filename}:${line}: ${message}`);
  };

  lines.forEach((line, index) => {
    if ([...line].length > MAX_LINE_LENGTH) {
      addError(index + 1, `line exceeds ${MAX_LINE_LENGTH} characters`);
    }
  });

  const unreleased = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line === "## [Unreleased]");
  if (unreleased.length !== 1) {
    addError(1, "expected exactly one '## [Unreleased]' heading");
    return errors;
  }

  const start = unreleased[0].index + 1;
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) {
      end = index;
      break;
    }
  }

  const seenCategories = new Set();
  let category = null;
  let entry = null;

  const validateEntry = () => {
    if (!entry) return;
    const prose = entry.parts.join(" ").trim();
    const match = prose.match(/^`(\d{4}-\d{2}-\d{2})`\s+\*\*.+?\*\*/);
    if (!match) {
      addError(entry.line, "Unreleased entry must start with `YYYY-MM-DD` and a bold outcome");
    } else if (!validIsoDate(match[1])) {
      addError(entry.line, `'${match[1]}' is not a valid ISO calendar date`);
    }
    const words = wordCount(prose);
    if (words > MAX_ENTRY_WORDS) {
      addError(entry.line, `entry has ${words} words; maximum is ${MAX_ENTRY_WORDS}`);
    }
    if (!/(#\d+|https?:\/\/|docs\/decisions\/|\bADR[- ]?\d+)/i.test(prose)) {
      addError(entry.line, "entry needs a PR, issue, ADR, or equivalent durable reference");
    }
    entry = null;
  };

  for (let index = start; index < end; index += 1) {
    const line = lines[index];
    const heading = line.match(/^### (.+)$/);
    if (heading) {
      validateEntry();
      category = heading[1];
      if (!ALLOWED_CATEGORIES.has(category)) {
        addError(index + 1, `unsupported Unreleased category '${category}'`);
      }
      if (seenCategories.has(category)) {
        addError(index + 1, `duplicate Unreleased category '${category}'`);
      }
      seenCategories.add(category);
      continue;
    }

    if (line.startsWith("- ")) {
      validateEntry();
      if (!category) {
        addError(index + 1, "Unreleased entry appears before a category heading");
      }
      entry = { line: index + 1, parts: [line.slice(2)] };
      continue;
    }

    const trimmed = line.trim();
    if (entry && trimmed && !trimmed.startsWith("<!--")) {
      entry.parts.push(trimmed);
    }
  }
  validateEntry();

  lines.forEach((line, index) => {
    const release = line.match(/^## \[[^\]]+\] - (\d{4}-\d{2}-\d{2})$/);
    if (release && !validIsoDate(release[1])) {
      addError(index + 1, `'${release[1]}' is not a valid release date`);
    }
  });

  return errors;
}

async function main() {
  const filename = process.argv[2] || "CHANGELOG.md";
  const text = await readFile(filename, "utf8");
  const errors = validateChangelog(text, filename);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`${filename}: changelog format OK`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}

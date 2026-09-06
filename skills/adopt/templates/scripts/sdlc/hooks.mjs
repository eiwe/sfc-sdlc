#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guardPayload } from "./guards.mjs";

export async function runHook(checks, harness = "auto") {
  let raw = "";
  try {
    for await (const chunk of process.stdin) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 8 * 1024 * 1024) throw new Error("Hook input exceeds 8 MiB");
    }
    const result = guardPayload(JSON.parse(raw), { checks, harness });
    if (!result.allow) {
      process.stderr.write(`${result.reason}\n`);
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`SDLC preflight payload error: ${error.message}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runHook();

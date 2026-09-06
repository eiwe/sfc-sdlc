#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runHook } from "../../scripts/sdlc/hooks.mjs";
export { targetsProtectedBranch } from "../../scripts/sdlc/guards.mjs";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runHook(["push"], "claude");

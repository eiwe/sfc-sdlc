// Pi discovers .pi/extensions/*.ts. Host API supplies pi.on; no extra dependency.
import { guardPayload } from "../../scripts/sdlc/guards.mjs";

export default function sdlc(pi) {
  pi.on("tool_call", async (event, ctx) => {
    const result = guardPayload({ ...event, cwd: ctx.cwd }, { harness: "pi" });
    if (!result.allow) return { block: true, reason: result.reason };
  });
}

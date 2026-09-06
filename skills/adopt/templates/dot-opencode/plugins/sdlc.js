// OpenCode discovers .opencode/plugins/*.js; throwing blocks tool execution.
import { guardPayload } from "../../scripts/sdlc/guards.mjs";

export const SdlcPlugin = async ({ directory }) => ({
  "tool.execute.before": async (input, output) => {
    const result = guardPayload({ tool: input.tool, args: output.args, cwd: directory }, { harness: "opencode" });
    if (!result.allow) throw new Error(result.reason);
  },
});

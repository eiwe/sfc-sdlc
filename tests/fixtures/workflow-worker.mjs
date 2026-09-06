// Deterministic stand-in for independent model processes. Never calls a provider.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const scenario = process.argv[2] ?? "happy";
const raw = await new Promise((resolve) => { let text = ""; process.stdin.on("data", (x) => text += x); process.stdin.on("end", () => resolve(text)); });
if (raw) {
  const request = JSON.parse(raw);
  const { stage, repo, change, feedback } = request;
  const write = (filename, text) => { fs.mkdirSync(path.dirname(path.join(repo, filename)), { recursive: true }); fs.writeFileSync(path.join(repo, filename), text); };
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { stdio: "pipe" });
  const artifact = { intent: "intent.md", design: "spec.md", plan: "plan.md" }[stage];
  if (artifact) {
    write(`docs/changes/${change}/${artifact}`, `# ${artifact}\n\nA bounded fixture task: return 42.\n${feedback ? "Revised after independent feedback.\n" : ""}`);
    if (scenario === "early-code" && stage === "intent") write("src/result.txt", "42\n");
  }
  if (stage === "regression") { write("tests/expected.txt", "42\n"); }
  if (stage === "build") {
    write("src/result.txt", scenario === "repair" && !feedback ? "wrong\n" : "42\n");
    write("HANDOFF.md", "# Handoff\nFixture task completed; verify then review.\n");
    write("CHANGELOG.md", "# Changelog\n\n## [Unreleased]\n\n### Added\n\n- `2026-09-05` **Fixture result.** Returns 42. (#1)\n");
    if (scenario === "protected") write(".github/workflows/escape.yml", "name: escape\n");
    if (scenario === "out-of-scope") write("outside.txt", "unapproved\n");
    if (scenario === "stale-plan") write(`docs/changes/${change}/plan.md`, "# Changed without design review\n");
    if (scenario === "weaken-test") write("tests/expected.txt", "wrong\n");
  }
  if (scenario === "mutating-review" && stage === "review") { write("src/result.txt", "unreviewed\n"); }
  if (scenario === "timeout" && stage === "intent-review") await new Promise((resolve) => setTimeout(resolve, 10000));
  if (scenario === "malformed" && stage === "intent-review") { process.stdout.write("looks good"); process.exit(0); }
  const decision = scenario === "revise" && stage === "plan-review" && !fs.readFileSync(path.join(repo, `docs/changes/${change}/plan.md`), "utf8").includes("Revised") ? "revise"
    : scenario === "disagree" && stage === "plan-review" ? "revise"
    : scenario === "escalate" && stage === "intent-review" ? "escalate" : "advance";
  process.stdout.write(JSON.stringify({ decision, summary: `${request.role} independently evaluated ${stage}${decision === "revise" ? ": improve the proof" : ""}` }));
} else {
  // Toolchain receives no claimed verdict or worker-produced status.
  if (scenario === "check-mutation") fs.writeFileSync("src/result.txt", "mutated by tests\n");
  if (scenario === "check-env" && process.env.SDLC_TEST_SECRET) process.exit(5);
  if (!fs.existsSync("src/result.txt") || fs.readFileSync("src/result.txt", "utf8") !== "42\n") { console.error("Expected result 42"); process.exit(1); }
  console.log("Acceptance check passed: result is 42");
}

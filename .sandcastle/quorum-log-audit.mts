import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "@ai-hero/sandcastle";
import type { AgentProvider } from "@ai-hero/sandcastle";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";

// Single-stage Sandcastle runner for hourly Quorum & Execution log audits.
// Run on-demand or via cron/launchd with:
//   npx tsx .sandcastle/quorum-log-audit.mts
//
// Reads:   .sandcastle/quorum-log-audit.md (expanding all 4 !`...` 1-hour log blocks)
// Outputs: logs/quorum_audits/quorum_audit_<RUN_ID>.md
//          logs/quorum_audits/latest.md
// Logs:    .sandcastle/logs/<RUN_ID>-quorum-log-audit.log

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SHIM_BIN_DIR = join(__dirname, "bin");

export const IDLE_TIMEOUT_SECONDS = 10 * 60;
export const DEFAULT_AUDIT_MODEL = process.env.QUORUM_AUDIT_MODEL || "gemini-3.8-flash-high";
export const REPORT_DIR_REL = "logs/quorum_audits";
export const PROMPT_FILE_REL = "./.sandcastle/quorum-log-audit.md";

type StreamEvent =
    | { type: "text"; text: string }
    | { type: "result"; result: string }
    | { type: "tool_call"; name: string; args: string };

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function antigravity(
    model: string,
    extraEnv: Record<string, string> = {},
): AgentProvider {
    const streamedSteps = new Set<number>();
    return {
        name: "antigravity",
        env: {
            ...process.env,
            ...extraEnv,
            PATH: `${SHIM_BIN_DIR}:/Users/diesel/.local/bin:/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
        },
        captureSessions: false,
        buildPrintCommand({ prompt }) {
            return {
                command: [
                    "agy",
                    "-p",
                    shellQuote(prompt),
                    "--model",
                    shellQuote(model),
                    "--output-format",
                    "stream-json",
                    "--dangerously-skip-permissions",
                ].join(" "),
            };
        },
        parseStreamLine(line) {
            try {
                const ev = JSON.parse(line) as {
                    event?: string;
                    step_update?: {
                        step_index?: number;
                        state?: string;
                        step_type?: string;
                        tool_name?: string;
                        text_delta?: string;
                        thought?: string;
                        thinking?: string;
                        reasoning?: string;
                        tool_info?: unknown;
                    };
                    result?: { response?: string; error?: string };
                };
                if (ev.event === "result") {
                    const response = ev.result?.response;
                    const error = ev.result?.error;
                    const resultText =
                        typeof response === "string" && response.length > 0
                            ? response
                            : (error ?? "");
                    return [
                        {
                            type: "result",
                            result: resultText,
                        },
                    ];
                }
                if (ev.event !== "step_update" || !ev.step_update) return [];

                const step = ev.step_update;
                const events: StreamEvent[] = [];
                const thought = [step.thought, step.thinking, step.reasoning].find(
                    (value) => typeof value === "string" && value.length > 0,
                );
                if (thought) {
                    events.push({ type: "text", text: `[thought] ${thought}` });
                }
                if (
                    step.step_type === "agent_response" &&
                    typeof step.text_delta === "string" &&
                    step.text_delta.length > 0
                ) {
                    const index = step.step_index ?? -1;
                    const alreadyStreamed = streamedSteps.has(index);
                    if (step.state === "ACTIVE") {
                        streamedSteps.add(index);
                        events.push({ type: "text", text: step.text_delta });
                    } else if (!alreadyStreamed) {
                        events.push({ type: "text", text: step.text_delta });
                    }
                }
                if (step.step_type === "tool") {
                    events.push({
                        type: "tool_call",
                        name: step.tool_name ?? "tool",
                        args: JSON.stringify(step.tool_info ?? {}),
                    });
                }
                return events;
            } catch {
                // Ignore non-JSON log lines.
            }
            return [];
        },
    };
}

function buildRunId(now = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function parseAuditHours(argv = process.argv.slice(2)): number {
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if ((arg === "--hours" || arg === "-h") && argv[i + 1]) {
            const parsed = Number.parseInt(argv[i + 1]!, 10);
            if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
        if (arg?.startsWith("--hours=")) {
            const parsed = Number.parseInt(arg.slice("--hours=".length), 10);
            if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
    }
    const envHours = Number.parseInt(process.env.QUORUM_AUDIT_HOURS || "1", 10);
    return Number.isFinite(envHours) && envHours > 0 ? envHours : 1;
}

async function main() {
    process.chdir(REPO_ROOT);

    const auditHours = parseAuditHours();
    const tailLines = auditHours * 35000;
    const auditMins = auditHours * 60;
    const runId = buildRunId();
    const reportDirAbs = join(REPO_ROOT, REPORT_DIR_REL);
    const logDirAbs = join(REPO_ROOT, ".sandcastle/logs");
    mkdirSync(reportDirAbs, { recursive: true });
    mkdirSync(logDirAbs, { recursive: true });

    const reportPathRel = `${REPORT_DIR_REL}/quorum_audit_${runId}_${auditHours}h.md`;
    const reportPathAbs = join(REPO_ROOT, reportPathRel);
    const latestPathAbs = join(reportDirAbs, "latest.md");
    const streamLogRel = `.sandcastle/logs/${runId}-quorum-log-audit-${auditHours}h.log`;

    console.log(`[QUORUM AUDIT] Starting Sandcastle Quorum Log Audit (runId=${runId}, window=${auditHours}h, model=${DEFAULT_AUDIT_MODEL})`);
    console.log(`[QUORUM AUDIT] Prompt: ${PROMPT_FILE_REL}`);
    console.log(`[QUORUM AUDIT] Target Report: ${reportPathRel}`);

    const result = await run({
        name: "quorum-log-audit",
        agent: antigravity(DEFAULT_AUDIT_MODEL),
        sandbox: noSandbox(),
        maxIterations: 1,
        promptFile: PROMPT_FILE_REL,
        promptArgs: {
            RUN_ID: runId,
            REPORT_PATH: reportPathRel,
            AUDIT_HOURS: String(auditHours),
            TAIL_LINES: String(tailLines),
            AUDIT_MINS: String(auditMins),
        },
        branchStrategy: { type: "head" },
        logging: {
            type: "file",
            verbose: true,
            path: streamLogRel,
        },
        idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
    });

    // Fallback: if the agent returned the report in stdout without writing the file directly, persist it
    if (!existsSync(reportPathAbs) && result.stdout && result.stdout.trim().length > 0) {
        const cleaned = result.stdout
            .replace(/<promise>COMPLETE<\/promise>/g, "")
            .trim();
        writeFileSync(reportPathAbs, `${cleaned}\n`, "utf8");
    }

    if (!existsSync(reportPathAbs)) {
        throw new Error(`[QUORUM AUDIT FATAL] Report file was not generated at ${reportPathRel}`);
    }

    const reportContents = readFileSync(reportPathAbs, "utf8");
    writeFileSync(latestPathAbs, reportContents, "utf8");

    console.log(`[QUORUM AUDIT] ✅ Completed successfully.`);
    console.log(`[QUORUM AUDIT] Report saved to: ${reportPathRel}`);
    console.log(`[QUORUM AUDIT] Latest pointer : ${REPORT_DIR_REL}/latest.md`);
    console.log(`[QUORUM AUDIT] Stream log     : ${streamLogRel}`);
    process.exit(0);
}

main().catch((err) => {
    console.error(`[QUORUM AUDIT FATAL]`, err);
    process.exit(1);
});

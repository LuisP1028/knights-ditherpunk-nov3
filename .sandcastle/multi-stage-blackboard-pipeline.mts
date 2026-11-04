import { execFileSync } from "node:child_process";
import {
    appendFileSync,
    chmodSync,
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    realpathSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "@ai-hero/sandcastle";
import type { AgentProvider } from "@ai-hero/sandcastle";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";

// Multi-Stage Blackboard Pipeline Orchestrator:
//   Stage 1 (Discovery Blackboard):
//     5 Scanners (codebase-mapper, api-schema-mapper, mcp-provisioner, library-installer,
//     and kickstarted function-mapper) + background listener plan-1 -> writes refined-specification.md
//   Stage 2 (Architecture Planning Blackboard):
//     Lead coordinator plan-2 + planner-2.1..2.4 (+ conditional planner-2.5)
//     + background listener implementer -> writes implementation-blueprint.md
//   Stage 3 (Implementation Blackboard):
//     Lead coordinator implementer + implementer-1..4 (+ conditional implementer-5)
//     + background listener tester -> writes verification-blueprint.md
//   Stage 4 (Unified Review & Testing Blackboard):
//     Lead coordinator tester + tester-1..4 (+ conditional tester-5)
//   Stage 5 (Final Join):
//     merger joins the verified planBranch into main locally.
//
// CLI Usage:
//   npx tsx .sandcastle/multi-stage-blackboard-pipeline.mts [seed.md] [--kickstart=blackboard|handoff]

export const IDLE_TIMEOUT_SECONDS = 25 * 60;
export const MAX_ITERATIONS = 5;
export const MAX_WAIT_SECONDS = 60;

export type KickstartMode = "blackboard" | "handoff";

export const ALL_BLACKBOARD_AGENTS = [
    // Legacy compatibility IDs
    "plan",
    "plan-scan-1",
    "plan-scan-2",
    // Stage 1: Discovery & Spec Refinement
    "plan-1",
    "codebase-mapper",
    "api-schema-mapper",
    "mcp-provisioner",
    "library-installer",
    "function-mapper",
    // Stage 2: Architecture Planning
    "plan-2",
    "planner-2.1",
    "planner-2.2",
    "planner-2.3",
    "planner-2.4",
    "planner-2.5",
    // Stage 3: Implementation
    "implementer",
    "implementer-1",
    "implementer-2",
    "implementer-3",
    "implementer-4",
    "implementer-5",
    // Stage 4: Unified Review & Testing
    "tester",
    "tester-1",
    "tester-2",
    "tester-3",
    "tester-4",
    "tester-5",
    "reviewer",
] as const;

export type BlackboardAgentId = (typeof ALL_BLACKBOARD_AGENTS)[number];

export const GROUP_TARGETS = [
    "all",
    "scanners",
    "planners",
    "implementers",
    "testers",
] as const;

export type BlackboardGroupTarget = (typeof GROUP_TARGETS)[number];
export type BlackboardTarget = BlackboardGroupTarget | BlackboardAgentId;
export type BlackboardEntryType = "finding" | "request" | "claim" | "response";
export type BlackboardRequestStatus = "open" | "claimed" | "resolved" | "unfulfillable";
export type BlackboardAgentStatus = "pending" | "active" | "done" | "settled" | "terminated";

export const STAGE_MODELS: Record<string, string> = {
    "codebase-mapper": "gemini-3.8-flash-high",
    "api-schema-mapper": "gemini-3.8-flash-high",
    "mcp-provisioner": "gemini-3.8-flash-high",
    "library-installer": "gemini-3.8-flash-high",
    "function-mapper": "gemini-3.8-flash-high",
    "plan-1": "gemini-4-argon-high",
    "plan-2": "gemini-4-argon-high",
    "planner-2.1": "gemini-4-argon-high",
    "planner-2.2": "gemini-4-argon-high",
    "planner-2.3": "gemini-4-argon-high",
    "planner-2.4": "gemini-4-argon-high",
    "planner-2.5": "gemini-4-argon-high",
    implementer: "gemini-4-argon-high",
    "implementer-1": "gemini-4-argon-high",
    "implementer-2": "gemini-4-argon-high",
    "implementer-3": "gemini-4-argon-high",
    "implementer-4": "gemini-4-argon-high",
    "implementer-5": "gemini-4-argon-high",
    tester: "gemini-4-argon-high",
    "tester-1": "gemini-4-argon-high",
    "tester-2": "gemini-4-argon-high",
    "tester-3": "gemini-4-argon-high",
    "tester-4": "gemini-4-argon-high",
    "tester-5": "gemini-4-argon-high",
    merger: "gemini-3.8-flash-high",
};

export const REQUIRED_SANDCASTLE_FILES = [
    ".gitignore",
    "LANGUAGE.md",
    ".sandcastle/bin/grep",
    ".sandcastle/bin/blackboard",
    ".sandcastle/mcp.md",
    ".sandcastle/codebase-mapper.md",
    ".sandcastle/api-schema-mapper.md",
    ".sandcastle/mcp-provisioner.md",
    ".sandcastle/library-installer.md",
    ".sandcastle/function-mapper.md",
    ".sandcastle/plan-1.md",
    ".sandcastle/plan-2.md",
    ".sandcastle/planner-2.1.md",
    ".sandcastle/planner-2.2.md",
    ".sandcastle/planner-2.3.md",
    ".sandcastle/planner-2.4.md",
    ".sandcastle/planner-2.5.md",
    ".sandcastle/implementer.md",
    ".sandcastle/implementer-1.md",
    ".sandcastle/implementer-2.md",
    ".sandcastle/implementer-3.md",
    ".sandcastle/implementer-4.md",
    ".sandcastle/implementer-5.md",
    ".sandcastle/tester.md",
    ".sandcastle/tester-1.md",
    ".sandcastle/tester-2.md",
    ".sandcastle/tester-3.md",
    ".sandcastle/tester-4.md",
    ".sandcastle/tester-5.md",
    ".sandcastle/merger.md",
] as const;

const TRANSIENT_CACHE_NAMES = new Set([
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".DS_Store",
    ".coverage",
    "scratch",
    ".scratch",
]);

export interface BlackboardEntry {
    seq: number;
    timestamp: string;
    sender: BlackboardAgentId;
    target: BlackboardTarget;
    type: BlackboardEntryType;
    content: string;
    replyTo?: number | null;
    status?: BlackboardRequestStatus;
    claimedBy?: BlackboardAgentId | null;
    resolvedBy?: BlackboardAgentId | null;
    responseSeq?: number | null;
}

export interface BlackboardParticipantState {
    agent: BlackboardAgentId;
    status: BlackboardAgentStatus;
    lastSeenSeq: number;
    updatedAt: string;
}

export interface BlackboardEventRecord {
    eventId: number;
    timestamp: string;
    kind: string;
    actor?: BlackboardAgentId | "orchestrator";
    seq?: number;
    detail: Record<string, unknown>;
}

export interface BlackboardSnapshot {
    runId: string;
    sessionName: string;
    url: string;
    port: number;
    startedAt: string;
    stoppedAt: string | null;
    lastSeq: number;
    participants: Record<string, BlackboardParticipantState>;
    fileClaims: Record<string, BlackboardAgentId>;
    entries: BlackboardEntry[];
    events: BlackboardEventRecord[];
}

export const SHIM_BIN_DIR = resolve(process.cwd(), ".sandcastle", "bin");

export const GREP_SHIM_CONTENT = `#!/usr/bin/env bash
# Auto-generated Sandcastle POSIX-compatible grep shim
REAL_GREP="/usr/bin/grep"
if [ ! -x "$REAL_GREP" ]; then
    REAL_GREP=$(PATH=$(getconf PATH 2>/dev/null || echo "/usr/bin:/bin") command -v grep || echo "/usr/bin/grep")
fi

IS_RECURSIVE=0
prev_arg=""
for arg in "$@"; do
    if [[ "$arg" == "--" ]]; then
        break
    fi
    if [[ "$prev_arg" == "-d" || "$prev_arg" == "--directories" ]] && [[ "$arg" == "recurse" ]]; then
        IS_RECURSIVE=1
        break
    fi
    case "$arg" in
        --recursive|--directories=recurse)
            IS_RECURSIVE=1
            break
            ;;
        -[!-]*)
            short_flags="\${arg#-}"
            case "$short_flags" in
                e*|f*|m*|A*|B*|C*|d*) ;;
                *r*|*R*)
                    IS_RECURSIVE=1
                    break
                    ;;
            esac
            ;;
    esac
    prev_arg="$arg"
done

if [[ "$IS_RECURSIVE" -eq 0 ]]; then
    exec "$REAL_GREP" "$@"
fi

GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
EXCLUDES=("--exclude-dir=.git" "--exclude-dir=node_modules" "--exclude-dir=.venv" "--exclude-dir=__pycache__")

if [ -f "$GIT_ROOT/.gitignore" ]; then
    NEGATED="|"
    while IFS= read -r line || [[ -n "$line" ]]; do
        line="\${line%$'\\r'}"
        line="\${line#"\${line%%[![:space:]]*}"}"
        line="\${line%"\${line##*[![:space:]]}"}"
        if [[ "$line" == \\!* ]]; then
            neg_base=$(basename "\${line#!}")
            [[ -n "$neg_base" ]] && NEGATED="\${NEGATED}\${neg_base}|"
        fi
    done < "$GIT_ROOT/.gitignore"

    while IFS= read -r line || [[ -n "$line" ]]; do
        line="\${line%$'\\r'}"
        line="\${line#"\${line%%[![:space:]]*}"}"
        line="\${line%"\${line##*[![:space:]]}"}"
        [[ -z "$line" || "$line" == \\#* || "$line" == \\!* ]] && continue
        clean_name=$(basename "\${line%/}")
        [[ -z "$clean_name" || "$clean_name" == "." || "$clean_name" == ".." ]] && continue
        [[ "$NEGATED" == *"|\${clean_name}|"* ]] && continue

        if [[ "$line" == */ ]]; then
            EXCLUDES+=("--exclude-dir=$clean_name")
        elif [[ "$line" == *.* ]]; then
            EXCLUDES+=("--exclude=$clean_name")
        else
            EXCLUDES+=("--exclude-dir=$clean_name" "--exclude=$clean_name")
        fi
    done < "$GIT_ROOT/.gitignore"
fi

exec "$REAL_GREP" "\${EXCLUDES[@]}" "$@"
`;

export const BLACKBOARD_SHIM_CONTENT = `#!/usr/bin/env node
// Auto-generated Sandcastle Multi-Stage Ephemeral Blackboard CLI shim
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const VALID_AGENTS = new Set(${JSON.stringify(ALL_BLACKBOARD_AGENTS)});
const VALID_TARGETS = new Set(${JSON.stringify([...GROUP_TARGETS, ...ALL_BLACKBOARD_AGENTS])});

function printUsage() {
    const usage = [
        "Usage: blackboard <command> [options] [content...]",
        "",
        "Commands:",
        "  post-finding [--to <target>] <content>       Publish a finding (default --to all)",
        "  post-request --to <target> <content>         Publish a request to any peer or group (all|scanners|planners|implementers|testers)",
        "  claim [--seq <seq>] [content]                Claim an open request (--seq) or claim exclusive file/module ownership",
        "  reply --reply-to <seq> <content>             Publish a response resolving request <seq>",
        "  read [--since <seq>] [--wait <sec>]          Read ledger entries since <seq> (default 0)",
        "  wait-request --seq <seq> [--wait <sec>]      Block until request <seq> resolves",
        "  wait-scanners [--since <seq>] [--wait <sec>] Block until active peers complete",
        "  done                                         Mark calling agent done (enforces unread & open-request Obligation Gate)",
        "  status                                       Read unread delta and current peer/request statuses",
    ].join("\\n");
    console.log(usage);
}

function parseArgs(argv) {
    const positional = [];
    const flags = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--help" || arg === "-h") {
            flags.help = true;
        } else if (arg === "--json") {
            flags.json = true;
        } else if (arg === "--unread") {
            flags.unread = true;
        } else if (arg.startsWith("--") && arg.includes("=")) {
            const idx = arg.indexOf("=");
            flags[arg.slice(2, idx)] = arg.slice(idx + 1);
        } else if (
            arg === "--to" ||
            arg === "--target" ||
            arg === "--seq" ||
            arg === "--reply-to" ||
            arg === "--since" ||
            arg === "--wait" ||
            arg === "--type" ||
            arg === "--content" ||
            arg === "--message" ||
            arg === "--scope" ||
            arg === "-m" ||
            arg === "--agent" ||
            arg === "--run-id" ||
            arg === "--url"
        ) {
            const next = argv[i + 1];
            if (next === undefined) {
                throw new Error(\`Missing value for flag \${arg}\`);
            }
            const key = arg === "-m" ? "content" : arg.replace(/^-+/, "");
            flags[key] = next;
            i++;
        } else {
            positional.push(arg);
        }
    }
    return { positional, flags };
}

function detectGitBranchContext() {
    try {
        const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        for (const agent of VALID_AGENTS) {
            const prefix = \`agent/\${agent}-\`;
            if (branch.startsWith(prefix)) {
                return { agentId: agent, runId: branch.slice(prefix.length) };
            }
        }
        return null;
    } catch {
        return null;
    }
}

function detectRepoRoot() {
    try {
        const commonDir = execFileSync("git", ["rev-parse", "--git-common-dir"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        if (commonDir) {
            return dirname(resolve(process.cwd(), commonDir));
        }
    } catch {
        // Fallback
    }
    return process.cwd();
}

function resolveContext(flags) {
    let agentId = flags.agent || process.env.SANDCASTLE_AGENT_ID || "";
    let runId = flags["run-id"] || process.env.SANDCASTLE_RUN_ID || "";
    let url = flags.url || process.env.SANDCASTLE_BLACKBOARD_URL || "";

    if (!agentId || !runId) {
        const gitCtx = detectGitBranchContext();
        if (gitCtx) {
            if (!agentId) agentId = gitCtx.agentId;
            if (!runId) runId = gitCtx.runId;
        }
    }

    if (!url && runId) {
        const repoRoot = detectRepoRoot();
        const snapshotPath = resolve(repoRoot, ".sandcastle", "logs", \`\${runId}-blackboard.json\`);
        if (existsSync(snapshotPath)) {
            try {
                const snap = JSON.parse(readFileSync(snapshotPath, "utf8"));
                if (typeof snap.url === "string" && snap.url.length > 0) {
                    url = snap.url;
                }
            } catch {
                // Handled below
            }
        }
    }

    if (!agentId || !VALID_AGENTS.has(agentId)) {
        throw new Error(\`Blackboard context error: missing or invalid agent identity '\${agentId}'.\`);
    }
    if (!runId) {
        throw new Error("Blackboard context error: missing SANDCASTLE_RUN_ID.");
    }
    if (!url) {
        throw new Error(\`Blackboard context error: missing SANDCASTLE_BLACKBOARD_URL for runId=\${runId}.\`);
    }

    return { agentId, runId, url: url.replace(/\\/+$/, "") };
}

function formatEntryLine(entry) {
    const meta = [\`type=\${entry.type}\`];
    if (entry.status) meta.push(\`status=\${entry.status}\`);
    if (entry.replyTo !== undefined && entry.replyTo !== null) meta.push(\`replyTo=#\${entry.replyTo}\`);
    if (entry.claimedBy) meta.push(\`claimedBy=\${entry.claimedBy}\`);
    if (entry.resolvedBy) meta.push(\`resolvedBy=\${entry.resolvedBy}\`);
    if (entry.responseSeq !== undefined && entry.responseSeq !== null) meta.push(\`responseSeq=#\${entry.responseSeq}\`);
    return \`  [seq=#\${entry.seq}] [\${entry.timestamp}] \${entry.sender} -> \${entry.target} (\${meta.join(", ")}): \${entry.content}\`;
}

function formatOutput(data, isWrite) {
    const lines = [];
    const p = data.participants || {};
    const peerStr = Object.keys(p)
        .map((id) => \`\${id}=\${p[id]?.status || "unknown"}\`)
        .join(" | ");

    lines.push(\`=== BLACKBOARD [run_id=\${data.runId} | agent=\${data.caller} | last_seq=\${data.last_seq}] ===\`);
    lines.push(\`STATUS: \${data.action_status || (data.ok ? "OK" : "ERROR")}\`);
    lines.push(\`PEERS: \${peerStr}\`);

    if (data.message) lines.push(\`MESSAGE: \${data.message}\`);
    if (data.entry) lines.push(\`PUBLISHED: \${formatEntryLine(data.entry).trim()}\`);
    if (data.scanners_complete !== undefined) {
        lines.push(\`BARRIER: scanners_complete=\${Boolean(data.scanners_complete)}\`);
    }

    const reqForYou = Array.isArray(data.requests_for_you) ? data.requests_for_you : [];
    lines.push(\`REQUESTS TARGETING YOU (\${reqForYou.length}):\`);
    if (reqForYou.length === 0) {
        lines.push("  (none)");
    } else {
        for (const r of reqForYou) lines.push(formatEntryLine(r));
    }

    const deltaList = isWrite
        ? Array.isArray(data.piggybacked_entries) ? data.piggybacked_entries : []
        : Array.isArray(data.entries) ? data.entries : [];
    lines.push(isWrite ? \`PIGGYBACKED UNREAD DELTA (\${deltaList.length}):\` : \`LEDGER DELTA (\${deltaList.length}):\`);
    if (deltaList.length === 0) {
        lines.push("  (none)");
    } else {
        for (const entry of deltaList) lines.push(formatEntryLine(entry));
    }

    return lines.join("\\n");
}

async function main() {
    const rawArgs = process.argv.slice(2);
    const { positional, flags } = parseArgs(rawArgs);

    if (flags.help || positional.length === 0) {
        printUsage();
        process.exit(positional.length === 0 && !flags.help ? 1 : 0);
    }

    let subcommand = positional[0];
    const restPositional = positional.slice(1);

    if (subcommand === "help") {
        printUsage();
        process.exit(0);
    }

    const { agentId, runId, url } = resolveContext(flags);
    const contentText = (flags.content ?? flags.message ?? flags.scope ?? restPositional.join(" ")).trim();

    let endpoint = "";
    let method = "GET";
    let bodyObj = null;
    let isWrite = false;

    if (subcommand === "post-finding" || subcommand === "finding") {
        const target = flags.to || flags.target || "all";
        if (!VALID_TARGETS.has(target)) {
            throw new Error(\`Invalid target '\${target}'.\`);
        }
        if (!contentText) throw new Error("post-finding requires non-empty content.");
        endpoint = \`\${url}/api/finding\`;
        method = "POST";
        bodyObj = { sender: agentId, target, content: contentText };
        isWrite = true;
    } else if (subcommand === "post-request" || subcommand === "request") {
        const target = flags.to || flags.target || "all";
        if (!VALID_TARGETS.has(target)) {
            throw new Error(\`Invalid target '\${target}'.\`);
        }
        if (!contentText) throw new Error("post-request requires non-empty content.");
        endpoint = \`\${url}/api/request\`;
        method = "POST";
        bodyObj = { sender: agentId, target, content: contentText };
        isWrite = true;
    } else if (subcommand === "claim") {
        const seqRaw = flags.seq ?? flags["reply-to"];
        const seq = seqRaw !== undefined ? Number.parseInt(String(seqRaw), 10) : null;
        const target = flags.to || flags.target || "all";
        const claimContent = contentText || (seq !== null ? \`Claimed request #\${seq}.\` : "");
        if (!claimContent) throw new Error("claim requires --seq <seq> or a scope/file description.");
        endpoint = \`\${url}/api/claim\`;
        method = "POST";
        bodyObj = { sender: agentId, target, seq, content: claimContent };
        isWrite = true;
    } else if (subcommand === "reply" || subcommand === "respond") {
        const seqRaw = flags["reply-to"] ?? flags.seq ?? flags.to;
        const seq = Number.parseInt(String(seqRaw ?? ""), 10);
        if (!Number.isInteger(seq) || seq < 1) throw new Error("reply requires --reply-to <seq>.");
        if (!contentText) throw new Error("reply requires non-empty response content.");
        endpoint = \`\${url}/api/reply\`;
        method = "POST";
        bodyObj = { sender: agentId, replyTo: seq, content: contentText };
        isWrite = true;
    } else if (subcommand === "read" || subcommand === "poll" || subcommand === "status") {
        const sinceRaw = flags.since !== undefined ? Number.parseInt(String(flags.since), 10) : 0;
        const waitSec = flags.wait !== undefined ? Number.parseFloat(String(flags.wait)) : 0;
        const params = new URLSearchParams({
            agent: agentId,
            since: String(sinceRaw),
            wait: String(Number.isFinite(waitSec) && waitSec > 0 ? waitSec : 0),
        });
        endpoint = \`\${url}/api/read?\${params.toString()}\`;
        method = "GET";
    } else if (subcommand === "wait-request") {
        const seq = Number.parseInt(String(flags.seq ?? flags["reply-to"] ?? "0"), 10);
        const waitSec = flags.wait !== undefined ? Number.parseFloat(String(flags.wait)) : 30;
        const params = new URLSearchParams({
            agent: agentId,
            seq: String(seq),
            wait: String(Number.isFinite(waitSec) && waitSec > 0 ? waitSec : 30),
        });
        endpoint = \`\${url}/api/wait-request?\${params.toString()}\`;
        method = "GET";
    } else if (subcommand === "wait-scanners") {
        const sinceRaw = flags.since !== undefined ? Number.parseInt(String(flags.since), 10) : -1;
        const waitSec = flags.wait !== undefined ? Number.parseFloat(String(flags.wait)) : 45;
        const params = new URLSearchParams({
            agent: agentId,
            since: String(sinceRaw),
            wait: String(Number.isFinite(waitSec) && waitSec > 0 ? waitSec : 45),
        });
        endpoint = \`\${url}/api/wait-scanners?\${params.toString()}\`;
        method = "GET";
    } else if (subcommand === "done") {
        endpoint = \`\${url}/api/done\`;
        method = "POST";
        bodyObj = { sender: agentId };
    } else {
        throw new Error(\`Unknown blackboard subcommand '\${subcommand}'.\`);
    }

    const response = await fetch(endpoint, {
        method,
        headers: bodyObj ? { "content-type": "application/json" } : undefined,
        body: bodyObj ? JSON.stringify(bodyObj) : undefined,
    });

    const data = await response.json();
    if (flags.json) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log(formatOutput(data, isWrite));
    }

    if (!response.ok || data.ok === false) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(\`[blackboard error] \${err instanceof Error ? err.message : String(err)}\`);
    process.exit(1);
});
`;

export function bootstrapBlackboardShim(repoDir: string = process.cwd()): string {
    const binDir = resolve(repoDir, ".sandcastle", "bin");
    mkdirSync(binDir, { recursive: true });
    const shimPath = join(binDir, "blackboard");
    const currentContent = existsSync(shimPath) ? readFileSync(shimPath, "utf8") : null;
    if (currentContent !== BLACKBOARD_SHIM_CONTENT) {
        writeFileSync(shimPath, BLACKBOARD_SHIM_CONTENT, { encoding: "utf8" });
    }
    chmodSync(shimPath, 0o755);
    return shimPath;
}

export function bootstrapGrepShim(repoDir: string = process.cwd()): string {
    const binDir = resolve(repoDir, ".sandcastle", "bin");
    mkdirSync(binDir, { recursive: true });
    const shimPath = join(binDir, "grep");
    const currentContent = existsSync(shimPath) ? readFileSync(shimPath, "utf8") : null;
    if (currentContent !== GREP_SHIM_CONTENT) {
        writeFileSync(shimPath, GREP_SHIM_CONTENT, { encoding: "utf8" });
    }
    chmodSync(shimPath, 0o755);
    bootstrapBlackboardShim(repoDir);
    return shimPath;
}

export function isBlackboardAgentId(value: unknown): value is BlackboardAgentId {
    return typeof value === "string" && (ALL_BLACKBOARD_AGENTS as readonly string[]).includes(value);
}

export function isBlackboardTarget(value: unknown): value is BlackboardTarget {
    return (
        typeof value === "string" &&
        ((GROUP_TARGETS as readonly string[]).includes(value) || isBlackboardAgentId(value))
    );
}

export interface BlackboardServerOptions {
    repoDir?: string;
    sessionName?: string;
    participants?: readonly BlackboardAgentId[];
    workerAgents?: readonly BlackboardAgentId[];
    conditionalAgents?: readonly BlackboardAgentId[];
    onEntryPublished?: (entry: BlackboardEntry, server: BlackboardServer) => void;
    onConditionalAgentTriggered?: (agentId: BlackboardAgentId, triggeringEntry: BlackboardEntry, server: BlackboardServer) => void;
}

interface BlackboardWaiter {
    id: number;
    kind: "read" | "wait-request" | "wait-scanners";
    agent: BlackboardAgentId;
    sinceSeq: number;
    requestSeq?: number;
    baselineStatuses: Record<string, BlackboardAgentStatus>;
    timer: ReturnType<typeof setTimeout>;
    resolve: () => void;
}

export class BlackboardServer {
    public readonly runId: string;
    public readonly sessionName: string;
    public readonly repoDir: string;
    public readonly logDir: string;
    public readonly logJsonPath: string;
    public readonly logTextPath: string;
    public readonly startedAt: string;
    public stoppedAt: string | null = null;

    private server: Server | null = null;
    private boundPort = 0;
    private nextSeq = 1;
    private nextEventId = 1;
    private nextWaiterId = 1;
    private readonly entries: BlackboardEntry[] = [];
    private readonly events: BlackboardEventRecord[] = [];
    private readonly participants: Record<string, BlackboardParticipantState> = {};
    private readonly workerSet: Set<BlackboardAgentId>;
    private readonly conditionalSet: Set<BlackboardAgentId>;
    private readonly triggeredConditionals = new Set<BlackboardAgentId>();
    private readonly fileClaims = new Map<string, BlackboardAgentId>();
    private readonly waiters = new Set<BlackboardWaiter>();
    private readonly onEntryPublished?: (entry: BlackboardEntry, server: BlackboardServer) => void;
    private readonly onConditionalAgentTriggered?: (
        agentId: BlackboardAgentId,
        triggeringEntry: BlackboardEntry,
        server: BlackboardServer,
    ) => void;
    private closed = false;

    constructor(runId: string, options: BlackboardServerOptions = {}) {
        if (!runId || typeof runId !== "string" || runId.trim().length === 0) {
            throw new Error("BlackboardServer requires a non-empty runId.");
        }
        this.runId = runId.trim();
        this.sessionName = options.sessionName ?? "default";
        this.repoDir = options.repoDir ?? process.cwd();
        this.logDir = resolve(this.repoDir, ".sandcastle", "logs");
        mkdirSync(this.logDir, { recursive: true });
        this.logJsonPath = join(this.logDir, `${this.runId}-blackboard.json`);
        this.logTextPath = join(this.logDir, `${this.runId}-${this.sessionName}-blackboard.log`);
        this.startedAt = new Date().toISOString();
        this.onEntryPublished = options.onEntryPublished;
        this.onConditionalAgentTriggered = options.onConditionalAgentTriggered;

        const initialParticipants = options.participants ?? [
            "plan-1",
            "codebase-mapper",
            "api-schema-mapper",
            "mcp-provisioner",
            "library-installer",
            "function-mapper",
        ];
        this.conditionalSet = new Set(options.conditionalAgents ?? []);
        this.workerSet = new Set(
            options.workerAgents ??
                initialParticipants.filter((id) => id !== "plan-1" && id !== "plan-2" && id !== "implementer" && id !== "tester"),
        );

        for (const agent of initialParticipants) {
            this.participants[agent] = {
                agent,
                status: this.conditionalSet.has(agent) ? "pending" : "active",
                lastSeenSeq: 0,
                updatedAt: this.startedAt,
            };
        }
    }

    public get port(): number {
        return this.boundPort;
    }

    public get url(): string {
        if (!this.boundPort) {
            throw new Error(`BlackboardServer for ${this.runId} has not been started yet.`);
        }
        return `http://127.0.0.1:${this.boundPort}`;
    }

    public get lastSeq(): number {
        return this.entries.length;
    }

    public agentEnv(agentId: BlackboardAgentId): Record<string, string> {
        return {
            SANDCASTLE_BLACKBOARD_URL: this.url,
            SANDCASTLE_RUN_ID: this.runId,
            SANDCASTLE_AGENT_ID: agentId,
        };
    }

    public getFileClaims(): Record<string, BlackboardAgentId> {
        return Object.fromEntries(this.fileClaims.entries());
    }

    public isConditionalTriggered(agent: BlackboardAgentId): boolean {
        return this.triggeredConditionals.has(agent);
    }

    private ensureParticipant(agent: BlackboardAgentId, status: BlackboardAgentStatus = "active"): BlackboardParticipantState {
        if (!this.participants[agent]) {
            this.participants[agent] = {
                agent,
                status,
                lastSeenSeq: 0,
                updatedAt: new Date().toISOString(),
            };
        }
        return this.participants[agent];
    }

    public getEligibleAgentsForTarget(target: BlackboardTarget, sender: BlackboardAgentId): BlackboardAgentId[] {
        const registered = Object.keys(this.participants) as BlackboardAgentId[];
        if (target === "all") {
            return registered.filter((a) => a !== sender && this.participants[a]?.status !== "pending");
        }
        if (target === "scanners") {
            return registered.filter((a) =>
                ["codebase-mapper", "api-schema-mapper", "mcp-provisioner", "library-installer", "function-mapper", "plan-scan-1", "plan-scan-2"].includes(a),
            );
        }
        if (target === "planners") {
            return registered.filter((a) => a.startsWith("planner-2.") || a === "plan-1" || a === "plan-2");
        }
        if (target === "implementers") {
            return registered.filter((a) => a.startsWith("implementer-"));
        }
        if (target === "testers") {
            return registered.filter((a) => a.startsWith("tester-"));
        }
        return [target as BlackboardAgentId];
    }

    public areWorkersComplete(): boolean {
        for (const worker of this.workerSet) {
            const p = this.participants[worker];
            if (!p) continue;
            if (p.status === "pending") continue;
            if (p.status === "active") return false;
        }
        return true;
    }

    public markAgentActive(agent: BlackboardAgentId): void {
        const p = this.ensureParticipant(agent, "active");
        p.status = "active";
        p.updatedAt = new Date().toISOString();
        this.notifyWaiters();
    }

    public markAgentSettled(agent: BlackboardAgentId): void {
        const p = this.ensureParticipant(agent);
        if (p.status !== "done") {
            p.status = "settled";
            p.updatedAt = new Date().toISOString();
        }
        this.notifyWaiters();
    }

    public markAgentTerminated(agent: BlackboardAgentId, _reason = "stage failed"): void {
        const p = this.ensureParticipant(agent);
        p.status = "terminated";
        p.updatedAt = new Date().toISOString();
        this.notifyWaiters();
    }

    public async start(): Promise<this> {
        if (this.server) return this;
        this.server = createServer((req, res) => {
            this.handleHttpRequest(req, res).catch((err) => {
                if (!res.headersSent) {
                    this.sendJson(res, 500, {
                        ok: false,
                        runId: this.runId,
                        action_status: "INTERNAL_ERROR",
                        message: err instanceof Error ? err.message : String(err),
                    });
                }
            });
        });

        await new Promise<void>((resolveListen, rejectListen) => {
            this.server!.once("error", rejectListen);
            this.server!.listen(0, "127.0.0.1", () => {
                this.server!.removeListener("error", rejectListen);
                const addr = this.server!.address() as AddressInfo | null;
                if (!addr || typeof addr.port !== "number") {
                    rejectListen(new Error("Failed to bind ephemeral loopback port."));
                    return;
                }
                this.boundPort = addr.port;
                resolveListen();
            });
        });
        this.flushLogs();
        return this;
    }

    public closeSync(): void {
        if (this.closed) return;
        this.closed = true;
        this.stoppedAt = new Date().toISOString();
        for (const waiter of Array.from(this.waiters)) {
            clearTimeout(waiter.timer);
            this.waiters.delete(waiter);
            waiter.resolve();
        }
        this.flushLogs();
        if (this.server) {
            try {
                this.server.close();
            } catch {
                // Ignore
            }
            this.server = null;
        }
    }

    public async close(): Promise<void> {
        if (this.closed) return;
        const srv = this.server;
        this.closeSync();
        if (srv) {
            await new Promise<void>((r) => srv.close(() => r()));
        }
    }

    public getSnapshot(): BlackboardSnapshot {
        return {
            runId: this.runId,
            sessionName: this.sessionName,
            url: this.boundPort ? `http://127.0.0.1:${this.boundPort}` : "",
            port: this.boundPort,
            startedAt: this.startedAt,
            stoppedAt: this.stoppedAt,
            lastSeq: this.lastSeq,
            participants: { ...this.participants },
            fileClaims: this.getFileClaims(),
            entries: this.entries.map((e) => ({ ...e })),
            events: this.events.map((e) => ({ ...e })),
        };
    }

    private flushLogs(): void {
        try {
            writeFileSync(this.logJsonPath, JSON.stringify(this.getSnapshot(), null, 2), "utf8");
        } catch {
            // Best-effort
        }
    }

    private maybeTriggerConditional(target: BlackboardTarget, entry: BlackboardEntry): void {
        if (isBlackboardAgentId(target) && this.conditionalSet.has(target) && !this.triggeredConditionals.has(target)) {
            this.triggeredConditionals.add(target);
            this.markAgentActive(target);
            this.onConditionalAgentTriggered?.(target, entry, this);
        }
    }

    private computeRequestSummaries(caller: BlackboardAgentId) {
        const requestsForYou: BlackboardEntry[] = [];
        const otherOpenRequests: BlackboardEntry[] = [];
        for (const entry of this.entries) {
            if (entry.type !== "request") continue;
            if (entry.status !== "open" && entry.status !== "claimed") continue;
            const eligible = this.getEligibleAgentsForTarget(entry.target, entry.sender).includes(caller);
            const targetedAtCaller =
                (entry.status === "claimed" && entry.claimedBy === caller) ||
                (entry.status === "open" && eligible);
            if (targetedAtCaller) {
                requestsForYou.push({ ...entry });
            } else {
                otherOpenRequests.push({ ...entry });
            }
        }
        return { requestsForYou, otherOpenRequests };
    }

    private computeObligationsForDone(caller: BlackboardAgentId): BlackboardEntry[] {
        const obligations: BlackboardEntry[] = [];
        for (const entry of this.entries) {
            if (entry.type !== "request") continue;
            if (entry.status === "claimed" && entry.claimedBy === caller) {
                obligations.push({ ...entry });
            } else if (entry.status === "open" && entry.target === caller) {
                obligations.push({ ...entry });
            }
        }
        return obligations;
    }

    private isWaiterSatisfied(waiter: BlackboardWaiter): boolean {
        if (this.closed) return true;
        if (waiter.kind === "read") {
            return this.lastSeq > waiter.sinceSeq;
        }
        if (waiter.kind === "wait-request") {
            const reqEntry = this.entries.find((e) => e.seq === waiter.requestSeq && e.type === "request");
            if (!reqEntry) return true;
            return reqEntry.status === "resolved" || reqEntry.status === "unfulfillable";
        }
        if (waiter.kind === "wait-scanners") {
            return this.areWorkersComplete();
        }
        return true;
    }

    private notifyWaiters(): void {
        for (const waiter of Array.from(this.waiters)) {
            if (this.isWaiterSatisfied(waiter)) {
                clearTimeout(waiter.timer);
                this.waiters.delete(waiter);
                waiter.resolve();
            }
        }
    }

    private waitForCondition(
        req: IncomingMessage,
        kind: BlackboardWaiter["kind"],
        agent: BlackboardAgentId,
        sinceSeq: number,
        waitSeconds: number,
        requestSeq?: number,
    ): Promise<void> {
        const clamped = Math.max(0, Math.min(MAX_WAIT_SECONDS, waitSeconds));
        const probe: BlackboardWaiter = {
            id: 0,
            kind,
            agent,
            sinceSeq,
            requestSeq,
            baselineStatuses: {},
            timer: setTimeout(() => {}, 0),
            resolve: () => {},
        };
        clearTimeout(probe.timer);
        if (clamped <= 0 || this.isWaiterSatisfied(probe)) {
            return Promise.resolve();
        }
        return new Promise<void>((resolveWait) => {
            const waiter: BlackboardWaiter = {
                id: this.nextWaiterId++,
                kind,
                agent,
                sinceSeq,
                requestSeq,
                baselineStatuses: {},
                timer: setTimeout(() => {
                    this.waiters.delete(waiter);
                    resolveWait();
                }, Math.round(clamped * 1000)),
                resolve: () => resolveWait(),
            };
            this.waiters.add(waiter);
            req.once("close", () => {
                if (this.waiters.has(waiter)) {
                    clearTimeout(waiter.timer);
                    this.waiters.delete(waiter);
                    resolveWait();
                }
            });
        });
    }

    private async readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    }

    private sendJson(res: ServerResponse, statusCode: number, payload: Record<string, unknown>): void {
        const body = JSON.stringify(payload);
        res.writeHead(statusCode, {
            "content-type": "application/json; charset=utf-8",
            "content-length": Buffer.byteLength(body),
            "cache-control": "no-store",
        });
        res.end(body);
    }

    private buildWritePayload(
        caller: BlackboardAgentId,
        previousLastSeen: number,
        createdEntry: BlackboardEntry,
        actionStatus: string,
        message: string,
    ): Record<string, unknown> {
        const piggybacked = this.entries
            .filter((e) => e.seq > previousLastSeen && e.seq < createdEntry.seq)
            .map((e) => ({ ...e }));
        const p = this.ensureParticipant(caller);
        p.lastSeenSeq = this.lastSeq;
        p.updatedAt = new Date().toISOString();
        const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(caller);
        this.flushLogs();
        return {
            ok: true,
            runId: this.runId,
            caller,
            action_status: actionStatus,
            message,
            last_seq: this.lastSeq,
            entry: { ...createdEntry },
            piggybacked_entries: piggybacked,
            entries: piggybacked,
            participants: { ...this.participants },
            requests_for_you: requestsForYou,
            other_open_requests: otherOpenRequests,
        };
    }

    private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const parsedUrl = new URL(req.url ?? "/", `http://127.0.0.1:${this.boundPort || 80}`);
        const pathname = parsedUrl.pathname;

        if (req.method === "POST" && pathname === "/api/finding") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;
            const target = body.target ?? "all";
            const content = typeof body.content === "string" ? body.content.trim() : "";
            if (!isBlackboardAgentId(sender) || !isBlackboardTarget(target) || !content) {
                this.sendJson(res, 400, { ok: false, runId: this.runId, message: "Invalid finding payload." });
                return;
            }
            const p = this.ensureParticipant(sender);
            const prevSeen = p.lastSeenSeq;
            const entry: BlackboardEntry = {
                seq: this.nextSeq++,
                timestamp: new Date().toISOString(),
                sender,
                target,
                type: "finding",
                content,
            };
            this.entries.push(entry);
            this.maybeTriggerConditional(target, entry);
            this.onEntryPublished?.(entry, this);
            this.notifyWaiters();
            this.sendJson(
                res,
                201,
                this.buildWritePayload(sender, prevSeen, entry, "PUBLISHED_FINDING", `Published finding #${entry.seq}.`),
            );
            return;
        }

        if (req.method === "POST" && pathname === "/api/request") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;
            const target = body.target ?? "all";
            const content = typeof body.content === "string" ? body.content.trim() : "";
            if (!isBlackboardAgentId(sender) || !isBlackboardTarget(target) || !content) {
                this.sendJson(res, 400, { ok: false, runId: this.runId, message: "Invalid request payload." });
                return;
            }
            const p = this.ensureParticipant(sender);
            const prevSeen = p.lastSeenSeq;
            this.maybeTriggerConditional(target, {
                seq: this.nextSeq,
                timestamp: new Date().toISOString(),
                sender,
                target,
                type: "request",
                content,
            });
            const entry: BlackboardEntry = {
                seq: this.nextSeq++,
                timestamp: new Date().toISOString(),
                sender,
                target,
                type: "request",
                content,
                status: "open",
                claimedBy: null,
                resolvedBy: null,
                responseSeq: null,
            };
            this.entries.push(entry);
            this.onEntryPublished?.(entry, this);
            this.notifyWaiters();
            this.sendJson(
                res,
                201,
                this.buildWritePayload(sender, prevSeen, entry, "PUBLISHED_REQUEST", `Published request #${entry.seq}.`),
            );
            return;
        }

        if (req.method === "POST" && pathname === "/api/claim") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;
            const target = isBlackboardTarget(body.target) ? body.target : "all";
            const reqSeq = typeof body.seq === "number" && Number.isInteger(body.seq) ? body.seq : null;
            const content = typeof body.content === "string" ? body.content.trim() : "";
            if (!isBlackboardAgentId(sender)) {
                this.sendJson(res, 400, { ok: false, runId: this.runId, message: "Invalid sender." });
                return;
            }
            const p = this.ensureParticipant(sender);
            const prevSeen = p.lastSeenSeq;

            if (reqSeq !== null) {
                const targetReq = this.entries.find((e) => e.seq === reqSeq && e.type === "request");
                if (!targetReq) {
                    this.sendJson(res, 404, { ok: false, runId: this.runId, message: `Request #${reqSeq} not found.` });
                    return;
                }
                if (targetReq.status === "claimed" && targetReq.claimedBy && targetReq.claimedBy !== sender) {
                    this.sendJson(res, 409, {
                        ok: false,
                        runId: this.runId,
                        action_status: "CLAIM_CONFLICT",
                        message: `Request #${reqSeq} already claimed by '${targetReq.claimedBy}'.`,
                    });
                    return;
                }
                targetReq.status = "claimed";
                targetReq.claimedBy = sender;
                const claimEntry: BlackboardEntry = {
                    seq: this.nextSeq++,
                    timestamp: new Date().toISOString(),
                    sender,
                    target: targetReq.sender,
                    type: "claim",
                    replyTo: reqSeq,
                    content: content || `Claimed request #${reqSeq}.`,
                };
                this.entries.push(claimEntry);
                this.notifyWaiters();
                this.sendJson(
                    res,
                    200,
                    this.buildWritePayload(sender, prevSeen, claimEntry, "CLAIMED_REQUEST", `Claimed request #${reqSeq}.`),
                );
                return;
            }

            if (!content) {
                this.sendJson(res, 400, { ok: false, runId: this.runId, message: "Empty claim." });
                return;
            }

            // Anti-collision file/module ownership enforcement
            const existingOwner = this.fileClaims.get(content);
            if (existingOwner && existingOwner !== sender) {
                this.sendJson(res, 409, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "FILE_CLAIM_CONFLICT",
                    message: `Scope/file '${content}' is already claimed by '${existingOwner}'. Coordinate on Blackboard instead of double-writing.`,
                });
                return;
            }
            this.fileClaims.set(content, sender);

            const scopeEntry: BlackboardEntry = {
                seq: this.nextSeq++,
                timestamp: new Date().toISOString(),
                sender,
                target,
                type: "claim",
                content,
            };
            this.entries.push(scopeEntry);
            this.onEntryPublished?.(scopeEntry, this);
            this.notifyWaiters();
            this.sendJson(
                res,
                201,
                this.buildWritePayload(sender, prevSeen, scopeEntry, "CLAIMED_SCOPE", `Claimed scope '${content}'.`),
            );
            return;
        }

        if (req.method === "POST" && pathname === "/api/reply") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;
            const replyTo = typeof body.replyTo === "number" ? body.replyTo : null;
            const content = typeof body.content === "string" ? body.content.trim() : "";
            if (!isBlackboardAgentId(sender) || !replyTo || !content) {
                this.sendJson(res, 400, { ok: false, runId: this.runId, message: "Invalid reply payload." });
                return;
            }
            const p = this.ensureParticipant(sender);
            const prevSeen = p.lastSeenSeq;
            const targetReq = this.entries.find((e) => e.seq === replyTo && e.type === "request");
            if (!targetReq) {
                this.sendJson(res, 404, { ok: false, runId: this.runId, message: `Request #${replyTo} not found.` });
                return;
            }
            const responseEntry: BlackboardEntry = {
                seq: this.nextSeq++,
                timestamp: new Date().toISOString(),
                sender,
                target: targetReq.sender,
                type: "response",
                replyTo,
                content,
            };
            this.entries.push(responseEntry);
            targetReq.status = "resolved";
            targetReq.resolvedBy = sender;
            targetReq.responseSeq = responseEntry.seq;
            this.notifyWaiters();
            this.sendJson(
                res,
                200,
                this.buildWritePayload(sender, prevSeen, responseEntry, "RESOLVED_REQUEST", `Resolved request #${replyTo}.`),
            );
            return;
        }

        if (req.method === "GET" && pathname === "/api/read") {
            const agent = (parsedUrl.searchParams.get("agent") ?? "plan-1") as BlackboardAgentId;
            const rawSince = Number.parseInt(parsedUrl.searchParams.get("since") ?? "0", 10);
            const waitSec = Number.parseFloat(parsedUrl.searchParams.get("wait") ?? "0") || 0;
            const p = this.ensureParticipant(agent);
            const effectiveSince = rawSince < 0 ? p.lastSeenSeq : Math.max(0, rawSince);
            await this.waitForCondition(req, "read", agent, effectiveSince, waitSec);
            const deltaEntries = this.entries.filter((e) => e.seq > effectiveSince).map((e) => ({ ...e }));
            p.lastSeenSeq = Math.max(p.lastSeenSeq, this.lastSeq);
            p.updatedAt = new Date().toISOString();
            const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(agent);
            this.sendJson(res, 200, {
                ok: true,
                runId: this.runId,
                caller: agent,
                action_status: `READ_SINCE_${effectiveSince}`,
                last_seq: this.lastSeq,
                since_seq: effectiveSince,
                entries: deltaEntries,
                participants: { ...this.participants },
                requests_for_you: requestsForYou,
                other_open_requests: otherOpenRequests,
            });
            return;
        }

        if (req.method === "GET" && pathname === "/api/wait-request") {
            const agent = (parsedUrl.searchParams.get("agent") ?? "plan-1") as BlackboardAgentId;
            const reqSeq = Number.parseInt(parsedUrl.searchParams.get("seq") ?? "0", 10);
            const waitSec = Number.parseFloat(parsedUrl.searchParams.get("wait") ?? "30") || 30;
            if (!isBlackboardAgentId(agent)) {
                this.sendJson(res, 400, { ok: false, runId: this.runId, message: `Invalid agent '${agent}'.` });
                return;
            }
            const targetReq = this.entries.find((e) => e.seq === reqSeq && e.type === "request");
            if (!targetReq) {
                this.sendJson(res, 404, {
                    ok: false,
                    runId: this.runId,
                    caller: agent,
                    action_status: "REQUEST_NOT_FOUND",
                    message: `Request #${reqSeq} does not exist.`,
                });
                return;
            }
            const p = this.ensureParticipant(agent);
            const prevSeen = p.lastSeenSeq;
            await this.waitForCondition(req, "wait-request", agent, prevSeen, waitSec, reqSeq);
            const resolvingResponse =
                targetReq.responseSeq !== null && targetReq.responseSeq !== undefined
                    ? this.entries.find((e) => e.seq === targetReq.responseSeq) ?? null
                    : null;
            const deltaEntries = this.entries.filter((e) => e.seq > prevSeen).map((e) => ({ ...e }));
            p.lastSeenSeq = Math.max(p.lastSeenSeq, this.lastSeq);
            p.updatedAt = new Date().toISOString();
            const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(agent);
            this.sendJson(res, 200, {
                ok: true,
                runId: this.runId,
                caller: agent,
                action_status: `WAIT_REQUEST_${targetReq.status?.toUpperCase() ?? "UNKNOWN"}`,
                last_seq: this.lastSeq,
                waited_request: { ...targetReq },
                resolving_response: resolvingResponse ? { ...resolvingResponse } : null,
                entries: deltaEntries,
                participants: { ...this.participants },
                requests_for_you: requestsForYou,
                other_open_requests: otherOpenRequests,
            });
            return;
        }

        if (req.method === "GET" && pathname === "/api/wait-scanners") {
            const agent = (parsedUrl.searchParams.get("agent") ?? "plan-1") as BlackboardAgentId;
            const rawSince = Number.parseInt(parsedUrl.searchParams.get("since") ?? "-1", 10);
            const waitSec = Number.parseFloat(parsedUrl.searchParams.get("wait") ?? "45") || 45;
            const p = this.ensureParticipant(agent);
            const effectiveSince = rawSince < 0 ? p.lastSeenSeq : Math.max(0, rawSince);
            await this.waitForCondition(req, "wait-scanners", agent, effectiveSince, waitSec);
            const scannersComplete = this.areWorkersComplete();
            const deltaEntries = this.entries.filter((e) => e.seq > effectiveSince).map((e) => ({ ...e }));
            p.lastSeenSeq = Math.max(p.lastSeenSeq, this.lastSeq);
            p.updatedAt = new Date().toISOString();
            const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(agent);
            this.sendJson(res, 200, {
                ok: true,
                runId: this.runId,
                caller: agent,
                action_status: scannersComplete ? "SCANNERS_COMPLETE" : "SCANNERS_STILL_ACTIVE",
                scanners_complete: scannersComplete,
                last_seq: this.lastSeq,
                since_seq: effectiveSince,
                entries: deltaEntries,
                participants: { ...this.participants },
                requests_for_you: requestsForYou,
                other_open_requests: otherOpenRequests,
            });
            return;
        }

        if (req.method === "POST" && pathname === "/api/done") {
            const body = await this.readJsonBody(req);
            const sender = body.sender as BlackboardAgentId;
            if (!isBlackboardAgentId(sender)) {
                this.sendJson(res, 400, { ok: false, runId: this.runId, message: "Invalid sender." });
                return;
            }
            const p = this.ensureParticipant(sender);
            const prevSeen = p.lastSeenSeq;
            const unreadPeerEntries = this.entries.filter((e) => e.seq > prevSeen && e.sender !== sender);
            const pendingObligations = this.computeObligationsForDone(sender);
            p.lastSeenSeq = Math.max(prevSeen, this.lastSeq);
            p.updatedAt = new Date().toISOString();

            if (unreadPeerEntries.length > 0 || pendingObligations.length > 0) {
                this.sendJson(res, 409, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "REJECTED_OBLIGATIONS",
                    message: `Cannot mark '${sender}' done: ${unreadPeerEntries.length} unread peer entry(ies) and ${pendingObligations.length} unresolved request(s).`,
                    last_seq: this.lastSeq,
                    entries: unreadPeerEntries,
                    pending_obligations: pendingObligations,
                    participants: { ...this.participants },
                });
                return;
            }

            p.status = "done";
            p.updatedAt = new Date().toISOString();
            this.flushLogs();
            this.notifyWaiters();
            this.sendJson(res, 200, {
                ok: true,
                runId: this.runId,
                caller: sender,
                action_status: "DONE",
                message: `Agent '${sender}' marked done.`,
                last_seq: this.lastSeq,
                entries: [],
                participants: { ...this.participants },
            });
            return;
        }

        this.sendJson(res, 404, { ok: false, runId: this.runId, message: `Unknown endpoint ${pathname}` });
    }
}

export function syncRelativeFilesBetweenWorktrees(
    sourceDir: string,
    targetDir: string,
    relPaths: readonly string[],
): string[] {
    const synced: string[] = [];
    for (const relPath of relPaths) {
        const srcFull = join(sourceDir, relPath);
        if (!existsSync(srcFull)) continue;
        const dstFull = join(targetDir, relPath);
        mkdirSync(dirname(dstFull), { recursive: true });
        copyFileSync(srcFull, dstFull);
        synced.push(relPath);
    }
    return synced;
}

if (existsSync(resolve(process.cwd(), ".sandcastle"))) {
    bootstrapGrepShim(process.cwd());
    bootstrapBlackboardShim(process.cwd());
}

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", "'\\''")}'`;
}

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

export function errorText(error: unknown): string {
    if (error instanceof Error) {
        const anyErr = error as Error & { stderr?: string | Buffer; stdout?: string | Buffer; cause?: unknown };
        const parts = [
            error.message,
            typeof anyErr.stderr === "string" || Buffer.isBuffer(anyErr.stderr) ? String(anyErr.stderr) : "",
            typeof anyErr.stdout === "string" || Buffer.isBuffer(anyErr.stdout) ? String(anyErr.stdout) : "",
            anyErr.cause !== undefined ? errorText(anyErr.cause) : "",
        ];
        return parts.filter((p) => p.length > 0).join("\n");
    }
    return String(error ?? "");
}

export function isGitLock(error: unknown): boolean {
    const text = errorText(error).toLowerCase();
    return (
        text.includes("could not lock config file") ||
        text.includes("index.lock") ||
        text.includes("config.lock") ||
        text.includes("cannot lock ref") ||
        (text.includes("unable to create") && text.includes(".lock")) ||
        text.includes(".lock': file exists") ||
        text.includes(".lock: file exists") ||
        text.includes("another git process seems to be running") ||
        /\b[\w./-]+\.lock\b/.test(text)
    );
}

type StreamEvent =
    | { type: "text"; text: string }
    | { type: "result"; result: string }
    | { type: "tool_call"; name: string; args: string };

export function antigravity(
    model: string,
    extraEnv: Record<string, string> = {},
): AgentProvider {
    const streamedSteps = new Set<number>();
    return {
        name: "antigravity",
        env: {
            ...process.env,
            SKIP_GLOBAL_AUTO_SYNC: "1",
            ...extraEnv,
            PATH: `${SHIM_BIN_DIR}:${process.env.PATH || ""}`,
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
                    return [
                        {
                            type: "result",
                            result:
                                typeof response === "string" && response.length > 0
                                    ? response
                                    : (error ?? ""),
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
                // Non-JSON log line
            }
            return [];
        },
    };
}

export function ignoreMissing(command: string[], cwd?: string): void {
    try {
        execFileSync(command[0], command.slice(1), { cwd, stdio: "ignore" });
    } catch {
        // Ignore
    }
}

export function worktreeDir(branch: string, repoDir?: string): string {
    const rel = `.sandcastle/worktrees/${branch.replaceAll("/", "-")}`;
    return repoDir ? join(repoDir, rel) : rel;
}

export function cleanTransientWorktreeArtifacts(dir: string): void {
    if (!existsSync(dir)) return;
    function walkAndClean(currentDir: string) {
        let entries: string[] = [];
        try {
            entries = readdirSync(currentDir);
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry === ".git" || entry === "node_modules" || entry === ".venv") continue;
            const fullPath = join(currentDir, entry);
            if (TRANSIENT_CACHE_NAMES.has(entry)) {
                try {
                    rmSync(fullPath, { recursive: true, force: true });
                } catch {
                    // Best-effort
                }
                continue;
            }
            try {
                if (statSync(fullPath).isDirectory()) {
                    walkAndClean(fullPath);
                }
            } catch {
                // Ignore
            }
        }
    }
    walkAndClean(dir);
}

export function commitLeftovers(dir: string, branch: string, stageName = "stage"): boolean {
    if (!existsSync(dir)) return false;
    ignoreMissing(["git", "checkout", "HEAD", "--", "logs"], dir);
    ignoreMissing(["git", "clean", "-fd", "logs"], dir);
    cleanTransientWorktreeArtifacts(dir);
    const status = execFileSync("git", ["status", "--porcelain"], {
        cwd: dir,
        encoding: "utf8",
    });
    if (status.trim().length === 0) return false;
    execFileSync("git", ["add", "-A"], { cwd: dir, stdio: "inherit" });
    ignoreMissing(["git", "reset", "HEAD", "--", "logs"], dir);
    ignoreMissing(["git", "checkout", "HEAD", "--", "logs"], dir);
    ignoreMissing(["git", "clean", "-fd", "logs"], dir);
    const stagedStatus = execFileSync("git", ["diff", "--cached", "--name-only"], {
        cwd: dir,
        encoding: "utf8",
    });
    if (stagedStatus.trim().length === 0) return false;
    execFileSync(
        "git",
        ["commit", "-m", `chore(${stageName}): keep uncommitted stage files on ${branch}`],
        { cwd: dir, stdio: "inherit" },
    );
    return true;
}

export function branchExists(branch: string, repoDir: string = process.cwd()): boolean {
    try {
        execFileSync("git", ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`], {
            cwd: repoDir,
            stdio: "ignore",
        });
        return true;
    } catch {
        return false;
    }
}

export function isBranchAncestor(
    branch: string,
    targetRef = "HEAD",
    repoDir: string = process.cwd(),
): boolean {
    if (!branchExists(branch, repoDir)) return false;
    try {
        execFileSync("git", ["merge-base", "--is-ancestor", branch, targetRef], {
            cwd: repoDir,
            stdio: "ignore",
        });
        return true;
    } catch {
        return false;
    }
}

export function removeWorktreeDir(
    branch: string,
    options: { repoDir?: string; consolidateBeforeRemove?: boolean } = {},
): void {
    const repoDir = options.repoDir ?? process.cwd();
    const dir = worktreeDir(branch, repoDir);
    const mergeDir = join(repoDir, `.sandcastle/worktrees/merge-${branch.replaceAll("/", "-")}`);
    if (options.consolidateBeforeRemove !== false && existsSync(dir)) {
        try {
            commitLeftovers(dir, branch, "cleanup");
        } catch {
            // Ignore
        }
    }
    ignoreMissing(["git", "worktree", "remove", "--force", dir], repoDir);
    ignoreMissing(["git", "worktree", "remove", "--force", mergeDir], repoDir);
    ignoreMissing(["rm", "-rf", dir], repoDir);
    ignoreMissing(["rm", "-rf", mergeDir], repoDir);
}

export function teardownWorktree(
    branch: string,
    options: {
        repoDir?: string;
        deleteBranch?: boolean;
        verifiedTargetRef?: string;
    } = {},
): void {
    const repoDir = options.repoDir ?? process.cwd();
    const deleteBranch = options.deleteBranch ?? false;
    const verifiedTargetRef = options.verifiedTargetRef ?? "HEAD";
    removeWorktreeDir(branch, { repoDir, consolidateBeforeRemove: true });
    ignoreMissing(["git", "worktree", "prune"], repoDir);
    if (deleteBranch && branch !== "main") {
        if (isBranchAncestor(branch, verifiedTargetRef, repoDir)) {
            ignoreMissing(["git", "branch", "-D", branch], repoDir);
        }
    }
}

let worktreeCreationChain: Promise<void> = Promise.resolve();

export function ensureWorktree(
    branch: string,
    repoDir: string = process.cwd(),
    baseRef = "HEAD",
): Promise<string> {
    const task = worktreeCreationChain.then(async () => {
        if (branch === "main" || branch === "HEAD") {
            return repoDir;
        }
        const wtDir = worktreeDir(branch, repoDir);
        if (existsSync(wtDir)) {
            return wtDir;
        }
        mkdirSync(join(repoDir, ".sandcastle", "worktrees"), { recursive: true });
        const maxAttempts = 6;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (existsSync(wtDir)) {
                    return wtDir;
                }
                ignoreMissing(["git", "worktree", "prune"], repoDir);
                const args = [
                    "-c",
                    "checkout.workers=0",
                    "-c",
                    "branch.autoSetupMerge=false",
                    "-c",
                    "push.autoSetupRemote=false",
                    "worktree",
                    "add",
                    ...(branchExists(branch, repoDir) ? [wtDir, branch] : ["-b", branch, wtDir, baseRef]),
                ];
                execFileSync("git", args, { cwd: repoDir, stdio: "inherit" });
                return wtDir;
            } catch (error) {
                if (!isGitLock(error) || attempt === maxAttempts) throw error;
                await sleep(500 * attempt);
            }
        }
        return wtDir;
    });
    worktreeCreationChain = task.then(
        () => undefined,
        () => undefined,
    );
    return task;
}

function execMergeWithFallback(cwd: string, fromBranch: string): void {
    try {
        execFileSync("git", ["merge", "--no-ff", "--no-edit", "-X", "ours", fromBranch], {
            cwd,
            stdio: "inherit",
        });
    } catch {
        // Resolve modify/delete conflicts (e.g. transient logs/) by keeping HEAD/theirs and committing
        ignoreMissing(["git", "rm", "-rf", "--ignore-unmatch", "logs"], cwd);
        ignoreMissing(["git", "checkout", "--ours", "."], cwd);
        execFileSync("git", ["add", "-A"], { cwd, stdio: "inherit" });
        execFileSync("git", ["commit", "--no-edit"], { cwd, stdio: "inherit" });
    }
}

export function mergeInto(branch: string, fromBranch: string, repoDir: string = process.cwd()): void {
    if (!branchExists(fromBranch, repoDir)) return;
    const sourceWorktree = worktreeDir(fromBranch, repoDir);
    if (existsSync(sourceWorktree)) {
        commitLeftovers(sourceWorktree, fromBranch, "pre-merge-source");
    }
    const existing = worktreeDir(branch, repoDir);
    if (existsSync(existing)) {
        ignoreMissing(["git", "merge", "--abort"], existing);
        commitLeftovers(existing, branch, "pre-merge-target");
        execMergeWithFallback(existing, fromBranch);
        return;
    }
    const dir = join(repoDir, `.sandcastle/worktrees/merge-${branch.replaceAll("/", "-")}`);
    ignoreMissing(["git", "worktree", "remove", "--force", dir], repoDir);
    ignoreMissing(["rm", "-rf", dir], repoDir);
    execFileSync("git", ["worktree", "add", dir, branch], { cwd: repoDir, stdio: "inherit" });
    try {
        execMergeWithFallback(dir, fromBranch);
    } finally {
        ignoreMissing(["git", "worktree", "remove", "--force", dir], repoDir);
        ignoreMissing(["rm", "-rf", dir], repoDir);
    }
}

export function assertStageManifest(
    stageName: string,
    branch: string,
    manifestPaths: string | string[],
    repoDir: string = process.cwd(),
): void {
    const wtDir = worktreeDir(branch, repoDir);
    if (existsSync(wtDir)) {
        commitLeftovers(wtDir, branch, stageName);
    }
    const paths = Array.isArray(manifestPaths) ? manifestPaths : [manifestPaths];
    for (const manifestPath of paths) {
        let content: string;
        try {
            content = execFileSync("git", ["show", `${branch}:${manifestPath}`], {
                cwd: repoDir,
                encoding: "utf8",
                stdio: ["ignore", "pipe", "pipe"],
            });
        } catch (error) {
            throw new Error(
                `Stage '${stageName}' (${branch}) failed mandatory handoff verification: required manifest '${manifestPath}' is missing on branch '${branch}'.`,
                { cause: error },
            );
        }
        if (content.trim().length === 0) {
            throw new Error(
                `Stage '${stageName}' (${branch}) failed mandatory handoff verification: required manifest '${manifestPath}' is empty on branch '${branch}'.`,
            );
        }
    }
}

let launchStaggerChain: Promise<void> = Promise.resolve();

async function staggerLaunchSlot(delayMs = 350): Promise<void> {
    const slot = launchStaggerChain.then(() => sleep(delayMs));
    launchStaggerChain = slot.then(
        () => undefined,
        () => undefined,
    );
    await slot;
}

export async function runWithLockRetry<T extends { commits: unknown[] }>(
    name: string,
    branch: string,
    launch: () => Promise<T>,
    options: {
        maxAttempts?: number;
        baseDelayMs?: number;
        repoDir?: string;
        baseRef?: string;
    } = {},
): Promise<T> {
    const maxAttempts = options.maxAttempts ?? 6;
    const baseDelayMs = options.baseDelayMs ?? 500;
    const repoDir = options.repoDir ?? process.cwd();
    const baseRef = options.baseRef ?? "HEAD";
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await ensureWorktree(branch, repoDir, baseRef);
            await staggerLaunchSlot(350);
            const result = await launch();
            return result;
        } catch (error) {
            if (!isGitLock(error) || attempt === maxAttempts) throw error;
            console.log(`${name} (${branch}) hit git/config lock, retry ${attempt}/${maxAttempts - 1}`);
            await sleep(baseDelayMs * attempt + Math.floor(Math.random() * 250));
        }
    }
    throw new Error(`${name} (${branch}) failed after git lock retries`);
}

export async function runStageWithManifestGate<T extends { commits: unknown[] }>(
    stageName: string,
    branch: string,
    manifestPaths: string | string[],
    launch: () => Promise<T>,
    options: {
        repoDir?: string;
        baseRef?: string;
        maxStageAttempts?: number;
        onAttemptStart?: (attempt: number) => void;
        onStageSettled?: (outcome: "settled" | "terminated", error?: unknown) => void;
    } = {},
): Promise<T> {
    const repoDir = options.repoDir ?? process.cwd();
    const baseRef = options.baseRef ?? "HEAD";
    const maxStageAttempts = options.maxStageAttempts ?? 2;
    let lastError: unknown;
    try {
        for (let stageAttempt = 1; stageAttempt <= maxStageAttempts; stageAttempt++) {
            options.onAttemptStart?.(stageAttempt);
            const result = await runWithLockRetry(stageName, branch, launch, {
                repoDir,
                baseRef,
            });
            const wtDir = worktreeDir(branch, repoDir);
            if (existsSync(wtDir)) {
                commitLeftovers(wtDir, branch, stageName);
            }
            try {
                assertStageManifest(stageName, branch, manifestPaths, repoDir);
                options.onStageSettled?.("settled");
                return result;
            } catch (manifestError) {
                lastError = manifestError;
            }
        }
    } catch (fatalError) {
        options.onStageSettled?.("terminated", fatalError);
        throw fatalError;
    }
    const finalErr =
        lastError instanceof Error
            ? lastError
            : new Error(`Stage '${stageName}' (${branch}) failed manifest verification gate.`);
    options.onStageSettled?.("terminated", finalErr);
    throw finalErr;
}

export function mintRunId(): string {
    return `${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "")}-${String(Date.now() % 1000).padStart(3, "0")}-${Math.random().toString(36).slice(2, 6)}`;
}

export interface CliPipelineOptions {
    seedsInput: string | string[];
    kickstartMode: KickstartMode;
    runId?: string;
}

export function parseCliOptions(argv: readonly string[] = process.argv.slice(2)): CliPipelineOptions {
    const collectedSeeds: string[] = [];
    let kickstartMode: KickstartMode = "blackboard";
    let runId: string | undefined;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--kickstart" || arg === "-k") {
            const val = argv[++i]?.trim();
            if (val !== "blackboard" && val !== "handoff") {
                throw new Error(`Invalid --kickstart value '${val}'. Expected 'blackboard' or 'handoff'.`);
            }
            kickstartMode = val;
        } else if (arg.startsWith("--kickstart=")) {
            const val = arg.slice("--kickstart=".length).trim();
            if (val !== "blackboard" && val !== "handoff") {
                throw new Error(`Invalid --kickstart value '${val}'. Expected 'blackboard' or 'handoff'.`);
            }
            kickstartMode = val;
        } else if (arg === "--run-id") {
            const next = argv[++i];
            if (!next) throw new Error(`Missing value for ${arg}`);
            runId = next.trim();
        } else if (arg.startsWith("--run-id=")) {
            runId = arg.slice("--run-id=".length).trim();
        } else if (arg === "--seed" || arg === "-s" || arg === "--authored") {
            const next = argv[++i];
            if (!next) throw new Error(`Missing value for ${arg}`);
            collectedSeeds.push(next.trim());
        } else if (arg.startsWith("--seed=")) {
            collectedSeeds.push(arg.slice("--seed=".length).trim());
        } else if (!arg.startsWith("-")) {
            collectedSeeds.push(arg.trim());
        } else {
            throw new Error(
                `Unknown CLI flag '${arg}'. Usage: npx tsx .sandcastle/multi-stage-blackboard-pipeline.mts [seed.md] [--kickstart=blackboard|handoff] [--run-id=<id>]`,
            );
        }
    }

    const nonEmpty = collectedSeeds.filter((s) => s.length > 0);
    return {
        seedsInput: nonEmpty.length === 0 ? "handoff/authored.txt" : nonEmpty.length === 1 ? nonEmpty[0] : nonEmpty,
        kickstartMode,
        ...(runId ? { runId } : {}),
    };
}

export interface AgentTaskRunner {
    (params: {
        name: BlackboardAgentId | "merger";
        branch: string;
        promptFile: string;
        model: string;
        manifestPaths: string | string[];
        baseRef: string;
        runId: string;
        seed: string;
        planBranch: string;
        env: Record<string, string>;
        onAttemptStart?: (attempt: number) => void;
        onStageSettled?: (outcome: "settled" | "terminated", error?: unknown) => void;
    }): Promise<{ commits: unknown[] }>;
}

function defaultAgentTaskRunner(repoDir: string): AgentTaskRunner {
    return ({
        name,
        branch,
        promptFile,
        model,
        manifestPaths,
        baseRef,
        runId,
        seed,
        planBranch,
        env,
        onAttemptStart,
        onStageSettled,
    }) =>
        runStageWithManifestGate(
            name,
            branch,
            manifestPaths,
            () =>
                run({
                    name,
                    agent: antigravity(model, env),
                    sandbox: noSandbox(),
                    maxIterations: MAX_ITERATIONS,
                    promptFile,
                    promptArgs: {
                        BRANCH: branch,
                        RUN_ID: runId,
                        SEED_PATH: seed,
                        PLAN_BRANCH: planBranch,
                    },
                    branchStrategy:
                        branch === "main" || branch === "HEAD"
                            ? { type: "head" }
                            : { type: "branch", branch },
                    logging: {
                        type: "file",
                        verbose: true,
                        path: `.sandcastle/logs/${runId}-${name}.log`,
                    },
                    idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
                }),
            {
                repoDir,
                baseRef,
                onAttemptStart,
                onStageSettled,
            },
        );
}

/**
 * Stage 1 — Discovery & Specification Refinement (Blackboard Session 1)
 * - Runs codebase-mapper, api-schema-mapper, mcp-provisioner, library-installer, and background listener plan-1.
 * - Kickstarts function-mapper via either:
 *   - "blackboard": when library-installer posts its first finding on Blackboard Session 1, OR
 *   - "handoff": when library-installer finishes and commits handoff/{{RUN_ID}}/libs-installed.txt.
 * - Syncs all 5 scanner reports into plan-1's worktree before wait-scanners unblocks plan-1.
 * - Merges all scanner branches into planBranch.
 */
export async function runDiscoverySession(options: {
    runId: string;
    seed: string;
    planBranch: string;
    kickstartMode: KickstartMode;
    repoDir?: string;
    taskRunner?: AgentTaskRunner;
}): Promise<void> {
    const repoDir = options.repoDir ?? process.cwd();
    const taskRunner = options.taskRunner ?? defaultAgentTaskRunner(repoDir);
    const { runId, seed, planBranch, kickstartMode } = options;

    const scannerDefs: ReadonlyArray<{
        name: BlackboardAgentId;
        branch: string;
        promptFile: string;
        manifest: string;
        syncFiles: readonly string[];
    }> = [
        {
            name: "codebase-mapper",
            branch: `agent/codebase-mapper-${runId}`,
            promptFile: "./.sandcastle/codebase-mapper.md",
            manifest: `handoff/${runId}/codebase-mapper.txt`,
            syncFiles: [`wayfinder/${runId}/codebase-map.md`, `handoff/${runId}/codebase-mapper.txt`],
        },
        {
            name: "api-schema-mapper",
            branch: `agent/api-schema-mapper-${runId}`,
            promptFile: "./.sandcastle/api-schema-mapper.md",
            manifest: `handoff/${runId}/api-schema-mapper.txt`,
            syncFiles: [`wayfinder/${runId}/api-schemas.md`, `handoff/${runId}/api-schema-mapper.txt`],
        },
        {
            name: "mcp-provisioner",
            branch: `agent/mcp-provisioner-${runId}`,
            promptFile: "./.sandcastle/mcp-provisioner.md",
            manifest: `handoff/${runId}/mcp-provisioner.txt`,
            syncFiles: [`wayfinder/${runId}/mcp-tools.md`, `handoff/${runId}/mcp-provisioner.txt`],
        },
        {
            name: "library-installer",
            branch: `agent/library-installer-${runId}`,
            promptFile: "./.sandcastle/library-installer.md",
            manifest: `handoff/${runId}/libs-installed.txt`,
            syncFiles: [`wayfinder/${runId}/installed-libraries.md`, `handoff/${runId}/libs-installed.txt`],
        },
    ];

    const functionMapperDef = {
        name: "function-mapper" as BlackboardAgentId,
        branch: `agent/function-mapper-${runId}`,
        promptFile: "./.sandcastle/function-mapper.md",
        manifest: `handoff/${runId}/function-mapper.txt`,
        syncFiles: [`wayfinder/${runId}/library-functions.md`, `handoff/${runId}/function-mapper.txt`],
    };

    let stage1AlreadyComplete = false;
    if (branchExists(planBranch, repoDir)) {
        try {
            assertStageManifest("plan-1", planBranch, `handoff/${runId}/refined-spec-ready.txt`, repoDir);
            stage1AlreadyComplete = true;
            console.log(`[pipeline] Stage 1 manifest already verified on ${planBranch}; skipping Stage 1 agent re-runs and joining branches.`);
        } catch {
            stage1AlreadyComplete = false;
        }
    }

    if (!stage1AlreadyComplete) {
        await ensureWorktree(planBranch, repoDir, "HEAD");
        for (const sc of scannerDefs) {
            await ensureWorktree(sc.branch, repoDir, "HEAD");
        }
        await ensureWorktree(functionMapperDef.branch, repoDir, "HEAD");

        let kickstartResolve!: () => void;
        let kickstartTriggered = false;
        const kickstartPromise = new Promise<void>((resolveKickstart) => {
            kickstartResolve = () => {
                if (!kickstartTriggered) {
                    kickstartTriggered = true;
                    resolveKickstart();
                }
            };
        });

        const blackboard = new BlackboardServer(runId, {
            repoDir,
            sessionName: "stage1-discovery",
            activeAgents: [
                "plan-1",
                "codebase-mapper",
                "api-schema-mapper",
                "mcp-provisioner",
                "library-installer",
                "function-mapper",
            ],
            workerAgents: [
                "codebase-mapper",
                "api-schema-mapper",
                "mcp-provisioner",
                "library-installer",
                "function-mapper",
            ],
            onEntryPublished: (entry) => {
                if (kickstartMode === "blackboard" && entry.sender === "library-installer" && entry.type === "finding") {
                    kickstartResolve();
                }
            },
        });
        await blackboard.start();

        const plan1Worktree = worktreeDir(planBranch, repoDir);
        const libInstallerWorktree = worktreeDir(`agent/library-installer-${runId}`, repoDir);
        const fnMapperWorktree = worktreeDir(functionMapperDef.branch, repoDir);

        try {
            const scannerTasks = scannerDefs.map((sc) =>
                taskRunner({
                    name: sc.name,
                    branch: sc.branch,
                    promptFile: sc.promptFile,
                    model: STAGE_MODELS[sc.name],
                    manifestPaths: sc.manifest,
                    baseRef: "HEAD",
                    runId,
                    seed,
                    planBranch,
                    env: blackboard.agentEnv(sc.name),
                    onAttemptStart: () => blackboard.markAgentActive(sc.name),
                    onStageSettled: (outcome, err) => {
                        const scWorktree = worktreeDir(sc.branch, repoDir);
                        syncRelativeFilesBetweenWorktrees(scWorktree, plan1Worktree, sc.syncFiles);
                        if (sc.name === "library-installer") {
                            syncRelativeFilesBetweenWorktrees(scWorktree, fnMapperWorktree, sc.syncFiles);
                            kickstartResolve();
                        }
                        if (outcome === "settled") {
                            blackboard.markAgentSettled(sc.name);
                        } else {
                            blackboard.markAgentTerminated(sc.name, errorText(err));
                        }
                    },
                }),
            );

            const functionMapperTask = (async () => {
                await kickstartPromise;
                syncRelativeFilesBetweenWorktrees(libInstallerWorktree, fnMapperWorktree, [
                    `wayfinder/${runId}/installed-libraries.md`,
                    `handoff/${runId}/libs-installed.txt`,
                ]);
                return taskRunner({
                    name: functionMapperDef.name,
                    branch: functionMapperDef.branch,
                    promptFile: functionMapperDef.promptFile,
                    model: STAGE_MODELS[functionMapperDef.name],
                    manifestPaths: functionMapperDef.manifest,
                    baseRef: "HEAD",
                    runId,
                    seed,
                    planBranch,
                    env: blackboard.agentEnv(functionMapperDef.name),
                    onAttemptStart: () => blackboard.markAgentActive(functionMapperDef.name),
                    onStageSettled: (outcome, err) => {
                        syncRelativeFilesBetweenWorktrees(
                            fnMapperWorktree,
                            plan1Worktree,
                            functionMapperDef.syncFiles,
                        );
                        if (outcome === "settled") {
                            blackboard.markAgentSettled(functionMapperDef.name);
                        } else {
                            blackboard.markAgentTerminated(functionMapperDef.name, errorText(err));
                        }
                    },
                });
            })();

            const plan1Task = taskRunner({
                name: "plan-1",
                branch: planBranch,
                promptFile: "./.sandcastle/plan-1.md",
                model: STAGE_MODELS["plan-1"],
                manifestPaths: `handoff/${runId}/refined-spec-ready.txt`,
                baseRef: "HEAD",
                runId,
                seed,
                planBranch,
                env: blackboard.agentEnv("plan-1"),
                onAttemptStart: () => blackboard.markAgentActive("plan-1"),
                onStageSettled: (outcome, err) => {
                    if (outcome === "settled") {
                        blackboard.markAgentSettled("plan-1");
                    } else {
                        blackboard.markAgentTerminated("plan-1", errorText(err));
                    }
                },
            });

            await Promise.all([...scannerTasks, functionMapperTask, plan1Task]);
        } finally {
            await blackboard.close();
        }
    }

    for (const sc of [...scannerDefs, functionMapperDef]) {
        mergeInto(planBranch, sc.branch, repoDir);
        teardownWorktree(sc.branch, {
            repoDir,
            deleteBranch: true,
            verifiedTargetRef: planBranch,
        });
    }
}

/**
 * Stage 2 — Architecture Planning (Blackboard Session 2)
 * - Runs lead coordinator plan-2, specialist planners planner-2.1..2.4 (+ conditional planner-2.5),
 *   and background listener implementer.
 * - Spawns planner-2.5 automatically if plan-2 addresses planner-2.5 on Blackboard Session 2.
 * - Syncs finished planner-2.x documents into implementer's worktree before wait-scanners unblocks implementer.
 * - Merges all Stage 2 branches into planBranch.
 */
export async function runPlanningSession(options: {
    runId: string;
    seed: string;
    planBranch: string;
    repoDir?: string;
    taskRunner?: AgentTaskRunner;
}): Promise<{ spawnedVisualPlanner: boolean }> {
    const repoDir = options.repoDir ?? process.cwd();
    const taskRunner = options.taskRunner ?? defaultAgentTaskRunner(repoDir);
    const { runId, seed, planBranch } = options;

    const corePlanners: ReadonlyArray<{
        name: BlackboardAgentId;
        branch: string;
        promptFile: string;
        manifest: string;
        syncFiles: readonly string[];
    }> = [
        {
            name: "planner-2.1",
            branch: `agent/planner-2.1-${runId}`,
            promptFile: "./.sandcastle/planner-2.1.md",
            manifest: `handoff/${runId}/planner-2.1.txt`,
            syncFiles: [`wayfinder/${runId}/architecture-and-dag.md`, `handoff/${runId}/planner-2.1.txt`],
        },
        {
            name: "planner-2.2",
            branch: `agent/planner-2.2-${runId}`,
            promptFile: "./.sandcastle/planner-2.2.md",
            manifest: `handoff/${runId}/planner-2.2.txt`,
            syncFiles: [`wayfinder/${runId}/storage-architecture.md`, `handoff/${runId}/planner-2.2.txt`],
        },
        {
            name: "planner-2.3",
            branch: `agent/planner-2.3-${runId}`,
            promptFile: "./.sandcastle/planner-2.3.md",
            manifest: `handoff/${runId}/planner-2.3.txt`,
            syncFiles: [`wayfinder/${runId}/stack-usage-guide.md`, `handoff/${runId}/planner-2.3.txt`],
        },
        {
            name: "planner-2.4",
            branch: `agent/planner-2.4-${runId}`,
            promptFile: "./.sandcastle/planner-2.4.md",
            manifest: `handoff/${runId}/planner-2.4.txt`,
            syncFiles: [`wayfinder/${runId}/suggested-optimizations.md`, `handoff/${runId}/planner-2.4.txt`],
        },
    ];

    const planner25Def = {
        name: "planner-2.5" as BlackboardAgentId,
        branch: `agent/planner-2.5-${runId}`,
        promptFile: "./.sandcastle/planner-2.5.md",
        manifest: `handoff/${runId}/planner-2.5.txt`,
        syncFiles: [`wayfinder/${runId}/visual-taste-direction.md`, `handoff/${runId}/planner-2.5.txt`],
    };

    const plan2Branch = `agent/plan-2-${runId}`;
    const implementerLeadBranch = `agent/implementer-${runId}`;

    let stage2AlreadyComplete = false;
    let spawnedVisualPlanner = branchExists(planner25Def.branch, repoDir);
    for (const checkBr of [implementerLeadBranch, planBranch]) {
        if (branchExists(checkBr, repoDir)) {
            try {
                assertStageManifest("implementer", checkBr, `handoff/${runId}/implementer.txt`, repoDir);
                stage2AlreadyComplete = true;
                console.log(`[pipeline] Stage 2 manifest already verified on ${checkBr}; skipping Stage 2 agent re-runs and joining branches.`);
                break;
            } catch {
                // Not yet complete on checkBr
            }
        }
    }

    if (!stage2AlreadyComplete) {
        await ensureWorktree(plan2Branch, repoDir, planBranch);
        await ensureWorktree(implementerLeadBranch, repoDir, planBranch);
        for (const pl of corePlanners) {
            await ensureWorktree(pl.branch, repoDir, planBranch);
        }

        const implementerWorktree = worktreeDir(implementerLeadBranch, repoDir);
        const plan2Worktree = worktreeDir(plan2Branch, repoDir);

        let planner25Task: Promise<{ commits: unknown[] }> | null = null;

        const blackboard = new BlackboardServer(runId, {
            repoDir,
            sessionName: "stage2-planning",
            activeAgents: [
                "plan-2",
                "planner-2.1",
                "planner-2.2",
                "planner-2.3",
                "planner-2.4",
                "implementer",
            ],
            conditionalAgents: ["planner-2.5"],
            workerAgents: [
                "plan-2",
                "planner-2.1",
                "planner-2.2",
                "planner-2.3",
                "planner-2.4",
                "planner-2.5",
            ],
            onConditionalAgentTriggered: (agent) => {
                if (agent === "planner-2.5" && !planner25Task) {
                    spawnedVisualPlanner = true;
                    planner25Task = ensureWorktree(planner25Def.branch, repoDir, planBranch).then(() =>
                        taskRunner({
                            name: planner25Def.name,
                            branch: planner25Def.branch,
                            promptFile: planner25Def.promptFile,
                            model: STAGE_MODELS[planner25Def.name],
                            manifestPaths: planner25Def.manifest,
                            baseRef: planBranch,
                            runId,
                            seed,
                            planBranch,
                            env: blackboard.agentEnv(planner25Def.name),
                            onAttemptStart: () => blackboard.markAgentActive(planner25Def.name),
                            onStageSettled: (outcome, err) => {
                                const wt25 = worktreeDir(planner25Def.branch, repoDir);
                                syncRelativeFilesBetweenWorktrees(wt25, implementerWorktree, planner25Def.syncFiles);
                                syncRelativeFilesBetweenWorktrees(wt25, plan2Worktree, planner25Def.syncFiles);
                                if (outcome === "settled") {
                                    blackboard.markAgentSettled(planner25Def.name);
                                } else {
                                    blackboard.markAgentTerminated(planner25Def.name, errorText(err));
                                }
                            },
                        }),
                    );
                }
            },
        });
        await blackboard.start();

        try {
            const plannerTasks = corePlanners.map((pl) =>
                taskRunner({
                    name: pl.name,
                    branch: pl.branch,
                    promptFile: pl.promptFile,
                    model: STAGE_MODELS[pl.name],
                    manifestPaths: pl.manifest,
                    baseRef: planBranch,
                    runId,
                    seed,
                    planBranch,
                    env: blackboard.agentEnv(pl.name),
                    onAttemptStart: () => blackboard.markAgentActive(pl.name),
                    onStageSettled: (outcome, err) => {
                        const plWt = worktreeDir(pl.branch, repoDir);
                        syncRelativeFilesBetweenWorktrees(plWt, implementerWorktree, pl.syncFiles);
                        syncRelativeFilesBetweenWorktrees(plWt, plan2Worktree, pl.syncFiles);
                        if (outcome === "settled") {
                            blackboard.markAgentSettled(pl.name);
                        } else {
                            blackboard.markAgentTerminated(pl.name, errorText(err));
                        }
                    },
                }),
            );

            const plan2Task = taskRunner({
                name: "plan-2",
                branch: plan2Branch,
                promptFile: "./.sandcastle/plan-2.md",
                model: STAGE_MODELS["plan-2"],
                manifestPaths: `handoff/${runId}/wayfinder-read-and-plan.txt`,
                baseRef: planBranch,
                runId,
                seed,
                planBranch,
                env: blackboard.agentEnv("plan-2"),
                onAttemptStart: () => blackboard.markAgentActive("plan-2"),
                onStageSettled: (outcome, err) => {
                    syncRelativeFilesBetweenWorktrees(plan2Worktree, implementerWorktree, [
                        `handoff/${runId}/wayfinder-read-and-plan.txt`,
                    ]);
                    if (outcome === "settled") {
                        blackboard.markAgentSettled("plan-2");
                    } else {
                        blackboard.markAgentTerminated("plan-2", errorText(err));
                    }
                },
            });

            const implementerListenerTask = taskRunner({
                name: "implementer",
                branch: implementerLeadBranch,
                promptFile: "./.sandcastle/implementer.md",
                model: STAGE_MODELS.implementer,
                manifestPaths: `handoff/${runId}/implementer.txt`,
                baseRef: planBranch,
                runId,
                seed,
                planBranch,
                env: blackboard.agentEnv("implementer"),
                onAttemptStart: () => blackboard.markAgentActive("implementer"),
                onStageSettled: (outcome, err) => {
                    if (outcome === "settled") {
                        blackboard.markAgentSettled("implementer");
                    } else {
                        blackboard.markAgentTerminated("implementer", errorText(err));
                    }
                },
            });

            await Promise.all([...plannerTasks, plan2Task]);
            if (planner25Task) {
                await planner25Task;
            }
            await implementerListenerTask;
        } finally {
            await blackboard.close();
        }
    }

    const branchesToMerge = [
        ...corePlanners.map((p) => p.branch),
        ...(spawnedVisualPlanner ? [planner25Def.branch] : []),
        plan2Branch,
        implementerLeadBranch,
    ];
    for (const br of branchesToMerge) {
        mergeInto(planBranch, br, repoDir);
        teardownWorktree(br, {
            repoDir,
            deleteBranch: true,
            verifiedTargetRef: planBranch,
        });
    }

    try {
        assertStageManifest("planner-2.5", planBranch, `handoff/${runId}/planner-2.5.txt`, repoDir);
        spawnedVisualPlanner = true;
    } catch {
        // planner-2.5 did not run
    }

    return { spawnedVisualPlanner };
}

/**
 * Stage 3 — Production Implementation (Blackboard Session 3)
 * - Spawns implementer-1..4 (+ implementer-5 if planner-2.5 ran) and background listener tester.
 * - Enforces exclusive file ownership via Blackboard `/api/claim` (FILE_CLAIM_CONFLICT on collision).
 * - Syncs implementer-x manifests into tester's worktree before wait-scanners unblocks tester.
 * - Merges all Stage 3 branches into planBranch.
 */
export async function runImplementationSession(options: {
    runId: string;
    seed: string;
    planBranch: string;
    includeVisualImplementer: boolean;
    repoDir?: string;
    taskRunner?: AgentTaskRunner;
}): Promise<void> {
    const repoDir = options.repoDir ?? process.cwd();
    const taskRunner = options.taskRunner ?? defaultAgentTaskRunner(repoDir);
    const { runId, seed, planBranch, includeVisualImplementer } = options;

    const implementerDefs: Array<{
        name: BlackboardAgentId;
        branch: string;
        promptFile: string;
        manifest: string;
    }> = [
        {
            name: "implementer-1",
            branch: `agent/implementer-1-${runId}`,
            promptFile: "./.sandcastle/implementer-1.md",
            manifest: `handoff/${runId}/implementer-1.txt`,
        },
        {
            name: "implementer-2",
            branch: `agent/implementer-2-${runId}`,
            promptFile: "./.sandcastle/implementer-2.md",
            manifest: `handoff/${runId}/implementer-2.txt`,
        },
        {
            name: "implementer-3",
            branch: `agent/implementer-3-${runId}`,
            promptFile: "./.sandcastle/implementer-3.md",
            manifest: `handoff/${runId}/implementer-3.txt`,
        },
        {
            name: "implementer-4",
            branch: `agent/implementer-4-${runId}`,
            promptFile: "./.sandcastle/implementer-4.md",
            manifest: `handoff/${runId}/implementer-4.txt`,
        },
    ];

    if (includeVisualImplementer) {
        implementerDefs.push({
            name: "implementer-5",
            branch: `agent/implementer-5-${runId}`,
            promptFile: "./.sandcastle/implementer-5.md",
            manifest: `handoff/${runId}/implementer-5.txt`,
        });
    }

    const testerLeadBranch = `agent/tester-${runId}`;
    let stage3AlreadyComplete = false;
    for (const checkBr of [testerLeadBranch, planBranch]) {
        if (branchExists(checkBr, repoDir)) {
            try {
                assertStageManifest("tester", checkBr, `handoff/${runId}/tester.txt`, repoDir);
                stage3AlreadyComplete = true;
                console.log(`[pipeline] Stage 3 manifest already verified on ${checkBr}; skipping Stage 3 agent re-runs and joining branches.`);
                break;
            } catch {
                // Not yet complete on checkBr
            }
        }
    }

    if (!stage3AlreadyComplete) {
        await ensureWorktree(testerLeadBranch, repoDir, planBranch);
        for (const imp of implementerDefs) {
            await ensureWorktree(imp.branch, repoDir, planBranch);
        }

        const testerWorktree = worktreeDir(testerLeadBranch, repoDir);
        const workerIds = implementerDefs.map((d) => d.name);

        const blackboard = new BlackboardServer(runId, {
            repoDir,
            sessionName: "stage3-implementation",
            activeAgents: [...workerIds, "tester"],
            workerAgents: workerIds,
        });
        await blackboard.start();

        try {
            const impTasks = implementerDefs.map((imp) =>
                taskRunner({
                    name: imp.name,
                    branch: imp.branch,
                    promptFile: imp.promptFile,
                    model: STAGE_MODELS[imp.name],
                    manifestPaths: imp.manifest,
                    baseRef: planBranch,
                    runId,
                    seed,
                    planBranch,
                    env: blackboard.agentEnv(imp.name),
                    onAttemptStart: () => blackboard.markAgentActive(imp.name),
                    onStageSettled: (outcome, err) => {
                        const impWt = worktreeDir(imp.branch, repoDir);
                        syncRelativeFilesBetweenWorktrees(impWt, testerWorktree, [imp.manifest]);
                        if (outcome === "settled") {
                            blackboard.markAgentSettled(imp.name);
                        } else {
                            blackboard.markAgentTerminated(imp.name, errorText(err));
                        }
                    },
                }),
            );

            const testerListenerTask = taskRunner({
                name: "tester",
                branch: testerLeadBranch,
                promptFile: "./.sandcastle/tester.md",
                model: STAGE_MODELS.tester,
                manifestPaths: `handoff/${runId}/tester.txt`,
                baseRef: planBranch,
                runId,
                seed,
                planBranch,
                env: blackboard.agentEnv("tester"),
                onAttemptStart: () => blackboard.markAgentActive("tester"),
                onStageSettled: (outcome, err) => {
                    if (outcome === "settled") {
                        blackboard.markAgentSettled("tester");
                    } else {
                        blackboard.markAgentTerminated("tester", errorText(err));
                    }
                },
            });

            await Promise.all([...impTasks, testerListenerTask]);
        } finally {
            await blackboard.close();
        }
    }

    for (const imp of implementerDefs) {
        mergeInto(planBranch, imp.branch, repoDir);
        teardownWorktree(imp.branch, {
            repoDir,
            deleteBranch: true,
            verifiedTargetRef: planBranch,
        });
    }
    mergeInto(planBranch, testerLeadBranch, repoDir);
    teardownWorktree(testerLeadBranch, {
        repoDir,
        deleteBranch: true,
        verifiedTargetRef: planBranch,
    });
}

/**
 * Stage 4 — Unified Review & Testing (Blackboard Session 4)
 * - Spawns tester-1..4 (+ tester-5 if implementer-5 ran) on Blackboard Session 4.
 * - Each unified reviewer/tester verifies code contracts, runs real tests/MCP checks,
 *   claims any defect remediation files on Blackboard, and writes handoff/{{RUN_ID}}/tester-x.txt.
 * - Merges all Stage 4 branches into planBranch.
 */
export async function runTestingSession(options: {
    runId: string;
    seed: string;
    planBranch: string;
    includeVisualTester: boolean;
    repoDir?: string;
    taskRunner?: AgentTaskRunner;
}): Promise<void> {
    const repoDir = options.repoDir ?? process.cwd();
    const taskRunner = options.taskRunner ?? defaultAgentTaskRunner(repoDir);
    const { runId, seed, planBranch, includeVisualTester } = options;

    const testerDefs: Array<{
        name: BlackboardAgentId;
        branch: string;
        promptFile: string;
        manifest: string;
    }> = [
        {
            name: "tester-1",
            branch: `agent/tester-1-${runId}`,
            promptFile: "./.sandcastle/tester-1.md",
            manifest: `handoff/${runId}/tester-1.txt`,
        },
        {
            name: "tester-2",
            branch: `agent/tester-2-${runId}`,
            promptFile: "./.sandcastle/tester-2.md",
            manifest: `handoff/${runId}/tester-2.txt`,
        },
        {
            name: "tester-3",
            branch: `agent/tester-3-${runId}`,
            promptFile: "./.sandcastle/tester-3.md",
            manifest: `handoff/${runId}/tester-3.txt`,
        },
        {
            name: "tester-4",
            branch: `agent/tester-4-${runId}`,
            promptFile: "./.sandcastle/tester-4.md",
            manifest: `handoff/${runId}/tester-4.txt`,
        },
    ];

    if (includeVisualTester) {
        testerDefs.push({
            name: "tester-5",
            branch: `agent/tester-5-${runId}`,
            promptFile: "./.sandcastle/tester-5.md",
            manifest: `handoff/${runId}/tester-5.txt`,
        });
    }

    let stage4AlreadyComplete = false;
    if (branchExists(planBranch, repoDir)) {
        try {
            assertStageManifest(
                "tester-all",
                planBranch,
                testerDefs.map((t) => t.manifest),
                repoDir,
            );
            stage4AlreadyComplete = true;
            console.log(`[pipeline] Stage 4 manifests already verified on ${planBranch}; skipping Stage 4 agent re-runs and joining branches.`);
        } catch {
            stage4AlreadyComplete = false;
        }
    }

    if (!stage4AlreadyComplete) {
        for (const tst of testerDefs) {
            await ensureWorktree(tst.branch, repoDir, planBranch);
        }

        const workerIds = testerDefs.map((d) => d.name);
        const blackboard = new BlackboardServer(runId, {
            repoDir,
            sessionName: "stage4-testing",
            activeAgents: workerIds,
            workerAgents: workerIds,
        });
        await blackboard.start();

        try {
            await Promise.all(
                testerDefs.map((tst) =>
                    taskRunner({
                        name: tst.name,
                        branch: tst.branch,
                        promptFile: tst.promptFile,
                        model: STAGE_MODELS[tst.name],
                        manifestPaths: tst.manifest,
                        baseRef: planBranch,
                        runId,
                        seed,
                        planBranch,
                        env: blackboard.agentEnv(tst.name),
                        onAttemptStart: () => blackboard.markAgentActive(tst.name),
                        onStageSettled: (outcome, err) => {
                            if (outcome === "settled") {
                                blackboard.markAgentSettled(tst.name);
                            } else {
                                blackboard.markAgentTerminated(tst.name, errorText(err));
                            }
                        },
                    }),
                ),
            );
        } finally {
            await blackboard.close();
        }
    }

    for (const tst of testerDefs) {
        mergeInto(planBranch, tst.branch, repoDir);
        teardownWorktree(tst.branch, {
            repoDir,
            deleteBranch: true,
            verifiedTargetRef: planBranch,
        });
    }
}

export async function runMultiStagePipeline(options: {
    seedsInput?: string | readonly string[];
    kickstartMode?: KickstartMode;
    runId?: string;
    repoDir?: string;
    taskRunner?: AgentTaskRunner;
    skipMerger?: boolean;
} = {}): Promise<void> {
    const repoDir = options.repoDir ?? process.cwd();
    const kickstartMode = options.kickstartMode ?? "blackboard";
    const taskRunner = options.taskRunner ?? defaultAgentTaskRunner(repoDir);
    const rawSeedsInput = options.seedsInput ?? "handoff/authored.txt";

    bootstrapGrepShim(repoDir);
    bootstrapBlackboardShim(repoDir);
    mkdirSync(join(repoDir, ".sandcastle", "logs"), { recursive: true });

    const rawSeedsList = Array.isArray(rawSeedsInput)
        ? rawSeedsInput
        : [rawSeedsInput as string];

    const seeds: string[] = [];
    for (const item of rawSeedsList) {
        const trimmed = item.trim();
        if (!trimmed) continue;
        if (trimmed.endsWith(".txt") && existsSync(resolve(repoDir, trimmed))) {
            const lines = readFileSync(resolve(repoDir, trimmed), "utf8")
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length > 0);
            if (lines.length > 0) {
                seeds.push(...lines);
                continue;
            }
        }
        seeds.push(trimmed);
    }

    for (const seed of seeds) {
        const runId = options.runId ?? mintRunId();
        const planBranch = `agent/plan-${runId}`;
        console.log(`[pipeline] Starting 4-stage Blackboard pipeline for ${seed} (runId=${runId}, kickstart=${kickstartMode})`);

        try {
            // Stage 1: Discovery Blackboard
            await runDiscoverySession({
                runId,
                seed,
                planBranch,
                kickstartMode,
                repoDir,
                taskRunner,
            });

            // Stage 2: Architecture Planning Blackboard
            const { spawnedVisualPlanner } = await runPlanningSession({
                runId,
                seed,
                planBranch,
                repoDir,
                taskRunner,
            });

            // Stage 3: Implementation Blackboard
            await runImplementationSession({
                runId,
                seed,
                planBranch,
                includeVisualImplementer: spawnedVisualPlanner,
                repoDir,
                taskRunner,
            });

            // Stage 4: Unified Review & Testing Blackboard
            await runTestingSession({
                runId,
                seed,
                planBranch,
                includeVisualTester: spawnedVisualPlanner,
                repoDir,
                taskRunner,
            });

            // Consolidate planBranch worktree before final join
            removeWorktreeDir(planBranch, { repoDir, consolidateBeforeRemove: true });

            // Stage 5: Final Local Join (merger)
            if (!options.skipMerger) {
                await taskRunner({
                    name: "merger",
                    branch: "main",
                    promptFile: "./.sandcastle/merger.md",
                    model: STAGE_MODELS.merger,
                    manifestPaths: `wayfinder/${runId}/refined-specification.md`,
                    baseRef: "main",
                    runId,
                    seed,
                    planBranch,
                    env: {},
                });
            }
        } finally {
            removeWorktreeDir(planBranch, { repoDir, consolidateBeforeRemove: true });
            ignoreMissing(["git", "worktree", "prune"], repoDir);
        }
    }
}

function isMainEntry(): boolean {
    if (!process.argv[1]) return false;
    try {
        return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));
    } catch {
        return resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
    }
}

if (isMainEntry()) {
    try {
        const cliOpts = parseCliOptions(process.argv.slice(2));
        runMultiStagePipeline({
            seedsInput: cliOpts.seedsInput,
            kickstartMode: cliOpts.kickstartMode,
            runId: cliOpts.runId,
        }).catch((error) => {
            console.error(errorText(error));
            process.exit(1);
        });
    } catch (error) {
        console.error(errorText(error));
        process.exit(1);
    }
}

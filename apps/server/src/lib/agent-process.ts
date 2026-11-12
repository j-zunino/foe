import { spawn } from "node:child_process";
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import type { AgentPreset } from "@repo/protocol";

const STDERR_TAIL_BYTES = 8 * 1024;
const KILL_GRACE_MS = 3_000;

function messageOf(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

// Startup failure carrying what the chat layer needs to render an error frame.
class AgentStartError extends Error {
    readonly authMethods: acp.AuthMethod[];
    readonly stderr: string;

    constructor(
        message: string,
        {
            authMethods,
            stderr,
        }: { authMethods: acp.AuthMethod[]; stderr: string },
    ) {
        super(message);
        this.name = "AgentStartError";
        this.authMethods = authMethods;
        this.stderr = stderr;
    }
}

interface AgentProcessOptions {
    preset: AgentPreset;
    cwd: string;
    // Aborting kills the child and rejects an in-flight initialize/session/new.
    signal?: AbortSignal;
    onUpdate: (update: acp.SessionUpdate) => void;
    // Unexpected child exit; intentional close() does not fire it.
    onExit?: (stderr: string) => void;
    // Returns the user's answer; cancel() and close() settle it as cancelled.
    requestPermission: (
        requestId: acp.JsonRpcId,
        params: acp.RequestPermissionRequest,
    ) => Promise<acp.RequestPermissionResponse>;
}

interface AgentProcess {
    readonly sessionId: string;
    readonly authMethods: acp.AuthMethod[];
    prompt: (text: string) => Promise<acp.PromptResponse>;
    cancel: () => Promise<void>;
    close: () => Promise<void>;
    stderrTail: () => string;
}

// Spawns one ACP agent, initializes it, and creates a single session.
async function startAgentProcess({
    preset,
    cwd,
    signal,
    onUpdate,
    onExit,
    requestPermission,
}: AgentProcessOptions): Promise<AgentProcess> {
    const child = spawn(preset.command, preset.args, {
        cwd,
        env: { ...process.env, ...preset.env },
        stdio: ["pipe", "pipe", "pipe"],
        detached: process.platform !== "win32",
    });

    const { stdin, stdout, stderr } = child;
    if (!stdin || !stdout || !stderr) {
        child.kill();
        throw new AgentStartError("Agent stdio was not piped", {
            authMethods: [],
            stderr: "",
        });
    }

    let tail = Buffer.alloc(0);
    stderr.on("data", (data: Buffer) => {
        tail = Buffer.concat([tail, data]).subarray(-STDERR_TAIL_BYTES);
    });
    const stderrTail = () => tail.toString();

    try {
        await new Promise<void>((resolve, reject) => {
            child.once("spawn", resolve);
            child.once("error", reject);
        });
    } catch (error) {
        throw new AgentStartError(
            `Agent "${preset.id}" failed to start: ${messageOf(error)}`,
            { authMethods: [], stderr: stderrTail() },
        );
    }

    const stream = acp.ndJsonStream(
        Writable.toWeb(stdin),
        Readable.toWeb(stdout) as ReadableStream<Uint8Array>,
    );

    let sessionId: string | undefined = undefined;

    // Inbound permission requests awaiting a user answer, keyed by JSON-RPC id.
    const permissions = new Map<
        acp.JsonRpcId,
        (response: acp.RequestPermissionResponse) => void
    >();

    const settlePermission = (
        requestId: acp.JsonRpcId,
        response: acp.RequestPermissionResponse,
    ) => {
        const settle = permissions.get(requestId);
        if (!settle) return; // already answered, cancelled, or never ours
        permissions.delete(requestId);
        settle(response);
    };

    const cancelPermissions = () => {
        for (const requestId of [...permissions.keys()]) {
            settlePermission(requestId, { outcome: { outcome: "cancelled" } });
        }
    };

    const connection = acp
        .client({ name: "foe" })
        .onNotification(acp.methods.client.session.update, ({ params }) => {
            if (params.sessionId === sessionId) {
                onUpdate(params.update);
            }
        })
        .onRequest(
            acp.methods.client.session.requestPermission,
            ({ params, requestId }) =>
                new Promise<acp.RequestPermissionResponse>((resolve) => {
                    permissions.set(requestId, resolve);
                    requestPermission(requestId, params).then(
                        (response) => settlePermission(requestId, response),
                        () =>
                            settlePermission(requestId, {
                                outcome: { outcome: "cancelled" },
                            }),
                    );
                }),
        )
        .connect(stream);

    const kill = (signal: NodeJS.Signals) => {
        const pid = child.pid;
        if (pid === undefined) return;

        if (process.platform === "win32") {
            child.kill(signal);
            // SIGKILL is not real on Windows; taskkill force-kills the tree.
            if (signal === "SIGKILL") {
                spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
                    stdio: "ignore",
                });
            }
            return;
        }

        try {
            process.kill(-pid, signal);
        } catch {
            // already exited
        }
    };

    let closing = false;
    const close = async () => {
        if (closing) return;
        closing = true;
        cancelPermissions();
        connection.close();

        if (child.exitCode !== null || child.signalCode !== null) return;

        const exited = new Promise<void>((resolve) => {
            if (child.exitCode !== null || child.signalCode !== null) resolve();
            else child.once("exit", () => resolve());
        });

        kill("SIGTERM");
        const timer = setTimeout(() => kill("SIGKILL"), KILL_GRACE_MS);
        timer.unref();
        await exited;
        clearTimeout(timer);
    };

    child.once("exit", () => {
        if (!closing) onExit?.(stderrTail());
    });

    signal?.addEventListener("abort", () => void close(), { once: true });
    if (signal?.aborted) void close();

    let init: acp.InitializeResponse;
    try {
        init = await connection.agent.request(acp.methods.agent.initialize, {
            protocolVersion: acp.PROTOCOL_VERSION,
            clientCapabilities: {
                fs: { readTextFile: false, writeTextFile: false },
                terminal: false,
            },
        });
    } catch (error) {
        await close();
        throw new AgentStartError(
            `Agent "${preset.id}" failed to initialize: ${messageOf(error)}`,
            { authMethods: [], stderr: stderrTail() },
        );
    }

    const authMethods = init.authMethods ?? [];

    let session: acp.NewSessionResponse;
    try {
        session = await connection.agent.request(
            acp.methods.agent.session.new,
            { cwd, mcpServers: [] },
        );
    } catch (error) {
        await close();
        throw new AgentStartError(
            `Agent "${preset.id}" failed to create a session: ${messageOf(error)}`,
            { authMethods, stderr: stderrTail() },
        );
    }

    sessionId = session.sessionId;

    let running = false;

    const prompt = async (text: string) => {
        if (running) throw new Error("prompt already running");
        running = true;
        try {
            return await connection.agent.request(
                acp.methods.agent.session.prompt,
                {
                    sessionId: session.sessionId,
                    prompt: [{ type: "text", text }],
                },
            );
        } finally {
            running = false;
            // A permission request cannot outlive its turn.
            cancelPermissions();
        }
    };

    const cancel = async () => {
        cancelPermissions();
        await connection.agent.notify(acp.methods.agent.session.cancel, {
            sessionId: session.sessionId,
        });
    };

    return {
        sessionId: session.sessionId,
        authMethods,
        stderrTail,
        close,
        prompt,
        cancel,
    };
}

export { AgentStartError, startAgentProcess, type AgentProcess };

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
    onUpdate: (update: acp.SessionUpdate) => void;
    requestPermission: (
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
    onUpdate,
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

    const connection = acp
        .client({ name: "foe" })
        .onNotification(acp.methods.client.session.update, ({ params }) => {
            if (params.sessionId === sessionId) {
                onUpdate(params.update);
            }
        })
        .onRequest(acp.methods.client.session.requestPermission, ({ params }) =>
            requestPermission(params),
        )
        .connect(stream);

    const kill = (signal: NodeJS.Signals) => {
        const pid = child.pid;
        if (pid === undefined) return;

        try {
            if (process.platform === "win32") child.kill(signal);
            else process.kill(-pid, signal);
        } catch {
            // already exited
        }
    };

    let closing = false;
    const close = async () => {
        if (closing) return;
        closing = true;
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

    return {
        sessionId: session.sessionId,
        authMethods,
        stderrTail,
        close,
        prompt: (text) =>
            connection.agent.request(acp.methods.agent.session.prompt, {
                sessionId: session.sessionId,
                prompt: [{ type: "text", text }],
            }),
        cancel: () =>
            connection.agent.notify(acp.methods.agent.session.cancel, {
                sessionId: session.sessionId,
            }),
    };
}

export { AgentStartError, startAgentProcess, type AgentProcess };

import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import {
    clientMessageSchema,
    type AuthMethodSummary,
    type ClientMessage,
    type ServerMessage,
} from "@repo/protocol";
import type { FastifyInstance } from "fastify";
import type WebSocket from "ws";
import { projects } from "../services/projects.js";
import {
    AgentStartError,
    startAgentProcess,
    type AgentProcess,
} from "./agent-process.js";

const START_TIMEOUT_MS = 10_000;

interface Chat {
    id: string;
    ws: WebSocket;
    agent?: AgentProcess;
    running: boolean;
    permissions: Map<string, (optionId: string | null) => void>;
    teardown: () => Promise<void>;
}

const chats = new Map<string, Chat>();

function messageOf(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

function send(ws: WebSocket, message: ServerMessage) {
    // Agent exit and prompt rejection can race the socket close.
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// One socket owns one chat, one agent process, and one ACP session.
function createChat(app: FastifyInstance, ws: WebSocket): Chat {
    const lifecycle = new AbortController();
    let closed = false;
    let started = false;

    const timer = setTimeout(
        () => ws.close(4000, "start timeout"),
        START_TIMEOUT_MS,
    );

    const chat: Chat = {
        id: randomUUID(),
        ws,
        running: false,
        permissions: new Map(),
        teardown: async () => {
            if (closed) return;
            closed = true;
            clearTimeout(timer);
            chats.delete(chat.id);
            cancelPermissions();
            lifecycle.abort();
            await chat.agent?.close();
        },
    };

    function fail(
        message: string,
        detail?: string,
        authMethods?: AuthMethodSummary[],
    ) {
        send(ws, {
            type: "error",
            message,
            ...(detail ? { detail } : {}),
            ...(authMethods?.length ? { authMethods } : {}),
        });
    }

    function failStart(message: string, detail?: string) {
        fail(message, detail);
        ws.close(1011, "agent start failed");
    }

    function cancelPermissions() {
        for (const settle of [...chat.permissions.values()]) settle(null);
        chat.permissions.clear();
    }

    async function start(projectId: string, agentId: string) {
        const project = projects.get(app.db, projectId);
        if (!project) {
            failStart("unknown project");
            return;
        }

        const preset = app.agents.find((agent) => agent.id === agentId);
        if (!preset) {
            failStart("unknown agent preset");
            return;
        }

        const info = await stat(project.path).catch(() => null);
        if (closed) return;
        if (!info?.isDirectory()) {
            failStart("project directory not found");
            return;
        }

        try {
            const agent = await startAgentProcess({
                preset,
                cwd: project.path,
                signal: lifecycle.signal,
                onUpdate: (update) => send(ws, { type: "update", update }),
                onExit: (stderr) => {
                    // Startup failures surface as `error`; only a live chat reports `closed`.
                    if (!chat.agent) return;
                    const reason = stderr.trim();
                    send(ws, { type: "closed", ...(reason ? { reason } : {}) });
                    ws.close();
                },
                requestPermission: (requestId, params) => {
                    const id = String(requestId);
                    return new Promise((resolve) => {
                        chat.permissions.set(id, (optionId) => {
                            chat.permissions.delete(id);
                            resolve(
                                optionId === null
                                    ? { outcome: { outcome: "cancelled" } }
                                    : { outcome: { outcome: "selected", optionId } },
                            );
                        });
                        send(ws, {
                            type: "permission_request",
                            requestId: id,
                            params,
                        });
                    });
                },
            });

            if (closed) {
                // The socket went away while initialize/session/new was in flight.
                await agent.close();
                return;
            }

            chat.agent = agent;
            chats.set(chat.id, chat);
            send(ws, {
                type: "ready",
                chatId: chat.id,
                sessionId: agent.sessionId,
                agentId: preset.id,
            });
        } catch (error) {
            if (closed) return;

            const startError =
                error instanceof AgentStartError ? error : undefined;
            const authMethods = startError?.authMethods.map(
                ({ id, name, description }) => ({ id, name, description }),
            );

            fail(messageOf(error), startError?.stderr, authMethods);
            ws.close(1011, "agent start failed");
        }
    }

    async function handle(raw: string) {
        if (closed) return;

        let message: ClientMessage;
        try {
            message = clientMessageSchema.parse(JSON.parse(raw));
        } catch {
            ws.close(4001, "invalid message");
            return;
        }

        switch (message.type) {
            case "start":
                if (started) {
                    fail("chat already started");
                    return;
                }
                started = true;
                clearTimeout(timer);
                await start(message.projectId, message.agentId);
                return;

            case "prompt": {
                const agent = chat.agent;
                if (!agent) {
                    fail("chat not started");
                    return;
                }
                if (chat.running) {
                    fail("prompt already running");
                    return;
                }

                chat.running = true;
                try {
                    const { stopReason } = await agent.prompt(message.text);
                    send(ws, { type: "prompt_done", stopReason });
                } catch (error) {
                    fail(messageOf(error), agent.stderrTail());
                } finally {
                    chat.running = false;
                    // A permission cannot outlive its turn; agent-process cancels them.
                    chat.permissions.clear();
                }
                return;
            }

            case "permission":
                chat.permissions.get(message.requestId)?.(message.optionId);
                return;

            case "cancel":
                if (!chat.agent) return;
                cancelPermissions();
                await chat.agent.cancel();
                return;
        }
    }

    ws.on("message", (data) => void handle(data.toString()));
    ws.on("close", () => void chat.teardown());
    ws.on("error", () => void chat.teardown());

    return chat;
}

// Shutdown path shared by buildApp's onClose hook.
function closeAllChats() {
    return Promise.all([...chats.values()].map((chat) => chat.teardown()));
}

export { closeAllChats, createChat, type Chat };

#!/usr/bin/env node

import * as acp from "@agentclientprotocol/sdk";
import { Readable, Writable } from "node:stream";

const REQUIRE_AUTH = process.env.FAKE_AGENT_REQUIRE_AUTH === "1";

if (process.env.FAKE_AGENT_STDERR === "1") {
    process.stderr.write("fake-agent: stderr switch enabled\n");
}

// One live prompt per session; a new prompt aborts the previous one.
const prompts = new Map<string, AbortController>();
let sessionCount = 0;

const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

function chunk(client: acp.AgentContext, sessionId: string, text: string) {
    return client.notify(acp.methods.client.session.update, {
        sessionId,
        update: {
            sessionUpdate: "agent_message_chunk",
            content: { type: "text", text },
        },
    });
}

async function runTurn(
    sessionId: string,
    text: string,
    client: acp.AgentContext,
    signal: AbortSignal,
): Promise<void> {
    if (signal.aborted) return;

    // Branch precedence: permission > slow > unsupported > default.
    if (text.includes("permission")) {
        await client.notify(acp.methods.client.session.update, {
            sessionId,
            update: {
                sessionUpdate: "tool_call",
                toolCallId: "call_edit",
                title: "Edit config file",
                kind: "edit",
                status: "pending",
                locations: [{ path: "/fake-agent/config.json" }],
                rawInput: { path: "/fake-agent/config.json" },
            },
        });

        const { outcome } = await client.request(
            acp.methods.client.session.requestPermission,
            {
                sessionId,
                toolCall: {
                    toolCallId: "call_edit",
                    title: "Edit config file",
                    kind: "edit",
                    status: "pending",
                },
                options: [
                    {
                        optionId: "proceed_once",
                        name: "Allow once",
                        kind: "allow_once",
                    },
                    {
                        optionId: "proceed_always",
                        name: "Always allow",
                        kind: "allow_always",
                    },
                    {
                        optionId: "cancel",
                        name: "Cancel",
                        kind: "reject_once",
                    },
                ],
            },
            // A cancel resolves the open permission as `{ outcome: "cancelled" }`.
            { cancellationSignal: signal },
        );

        const approved =
            outcome.outcome === "selected" &&
            (outcome.optionId === "proceed_once" ||
                outcome.optionId === "proceed_always");

        await client.notify(acp.methods.client.session.update, {
            sessionId,
            update: {
                sessionUpdate: "tool_call_update",
                toolCallId: "call_edit",
                status: approved ? "completed" : "failed",
            },
        });
        await chunk(
            client,
            sessionId,
            approved ? "Change applied." : "Change skipped.",
        );
        return;
    }

    if (text.includes("slow")) {
        for (let i = 0; i < 40 && !signal.aborted; i++) {
            await chunk(client, sessionId, `tick ${i + 1}`);
            await sleep(250);
        }
        return;
    }

    if (text.includes("unsupported")) {
        try {
            await client.request(acp.methods.client.fs.readTextFile, {
                sessionId,
                path: "/fake-agent/missing.md",
            });
        } catch (error) {
            await chunk(
                client,
                sessionId,
                `fs/read_text_file refused: ${
                    error instanceof Error ? error.message : "unknown error"
                }`,
            );
        }
        return;
    }

    await chunk(
        client,
        sessionId,
        "I'll help you with that. Let me start by reading some files.",
    );
    await chunk(client, sessionId, " Now I understand the project structure.");

    await client.notify(acp.methods.client.session.update, {
        sessionId,
        update: {
            sessionUpdate: "tool_call",
            toolCallId: "call_read",
            title: "Reading project files",
            kind: "read",
            status: "pending",
            locations: [{ path: "/fake-agent/README.md" }],
            rawInput: { path: "/fake-agent/README.md" },
        },
    });
    await client.notify(acp.methods.client.session.update, {
        sessionId,
        update: {
            sessionUpdate: "tool_call_update",
            toolCallId: "call_read",
            status: "completed",
            content: [
                {
                    type: "content",
                    content: { type: "text", text: "# Fake project" },
                },
            ],
            rawOutput: { content: "# Fake project" },
        },
    });
}

const stream = acp.ndJsonStream(
    Writable.toWeb(process.stdout),
    Readable.toWeb(process.stdin) as ReadableStream<Uint8Array>,
);

acp.agent({ name: "fake" })
    .onRequest(acp.methods.agent.initialize, () => ({
        protocolVersion: acp.PROTOCOL_VERSION,
        ...(REQUIRE_AUTH
            ? { authMethods: [{ id: "fake-login", name: "Fake login" }] }
            : {}),
    }))
    .onRequest(acp.methods.agent.session.new, () => {
        if (REQUIRE_AUTH) {
            throw acp.RequestError.authRequired();
        }
        return { sessionId: `fake-${process.pid}-s${++sessionCount}` };
    })
    .onRequest(acp.methods.agent.session.prompt, async ({ params, client }) => {
        prompts.get(params.sessionId)?.abort();
        const turn = new AbortController();
        prompts.set(params.sessionId, turn);

        const text = params.prompt
            .flatMap((block) => (block.type === "text" ? [block.text] : []))
            .join(" ")
            .toLowerCase();

        await runTurn(params.sessionId, text, client, turn.signal);

        return { stopReason: turn.signal.aborted ? "cancelled" : "end_turn" };
    })
    .onNotification(acp.methods.agent.session.cancel, ({ params }) => {
        prompts.get(params.sessionId)?.abort();
    })
    .connect(stream);

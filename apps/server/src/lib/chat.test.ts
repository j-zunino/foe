import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { AgentPreset, ClientMessage, ServerMessage } from "@repo/protocol";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { projects } from "../services/projects.js";
import { createDatabase } from "./db/index.js";
import { buildApp } from "./fastify.js";
import { getRepoRoot } from "./paths.js";

type Frame<T extends ServerMessage["type"]> = Extract<ServerMessage, { type: T }>;

const root = getRepoRoot();
const migrationsDir = resolve(root, "database/migrations");

const preset: AgentPreset = {
    id: "fake",
    name: "Fake agent",
    command: resolve(root, "apps/server/node_modules/.bin/tsx"),
    args: [resolve(root, "apps/server/fixtures/fake-agent.ts")],
    env: {},
};

const cleanups: (() => unknown)[] = [];

afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitUntil(check: () => boolean, timeout = 5_000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        if (check()) return;
        await sleep(25);
    }
    throw new Error("condition not met in time");
}

async function waitFor<T extends ServerMessage["type"]>(
    frames: ServerMessage[],
    type: T,
    predicate: (frame: Frame<T>) => boolean = () => true,
    after = 0,
): Promise<Frame<T>> {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
        const frame = frames
            .slice(after)
            .find(
                (frame): frame is Frame<T> =>
                    frame.type === type &&
                    predicate(frame as Frame<T>),
            );
        if (frame) return frame;
        await sleep(25);
    }
    throw new Error(`timed out waiting for ${type}`);
}

// The preset's args carry a marker so the spawned processes can be found again.
function countProcesses(marker: string) {
    try {
        return execFileSync("pgrep", ["-f", marker], { encoding: "utf8" })
            .trim()
            .split("\n")
            .filter(Boolean).length;
    } catch {
        return 0;
    }
}

async function setup(agents: AgentPreset[] = [preset]) {
    const database = createDatabase({ filename: ":memory:", migrationsDir });
    const projectDir = mkdtempSync(join(tmpdir(), "foe-chat-"));
    const project = await projects.add(database.db, {
        name: "chat test",
        path: projectDir,
    });

    const app = buildApp({ ...database, agents });
    await app.listen({ host: "127.0.0.1", port: 0 });
    cleanups.push(() => app.close());

    const { port } = app.server.address() as AddressInfo;
    return { app, projectId: project.id, url: `ws://127.0.0.1:${port}/ws` };
}

async function connect(url: string) {
    const ws = new WebSocket(url);
    const frames: ServerMessage[] = [];
    ws.on("message", (data) => {
        frames.push(JSON.parse(data.toString()) as ServerMessage);
    });
    await once(ws, "open");
    cleanups.push(() => ws.terminate());

    return {
        ws,
        frames,
        send(message: ClientMessage) {
            ws.send(JSON.stringify(message));
        },
        closed: new Promise<{ code: number; reason: string }>((resolve) => {
            ws.once("close", (code, reason) =>
                resolve({ code, reason: reason.toString() }),
            );
        }),
    };
}

type Client = Awaited<ReturnType<typeof connect>>;

async function startChat(client: Client, projectId: string) {
    client.send({ type: "start", projectId, agentId: "fake" });
    return waitFor(client.frames, "ready");
}

describe("chat websocket", () => {
    it("start returns ready with a session id", async () => {
        const { url, projectId } = await setup();
        const client = await connect(url);

        const ready = await startChat(client, projectId);

        expect(ready.sessionId).toMatch(/^fake-\d+-s1$/);
        expect(ready.chatId).toEqual(expect.any(String));
        expect(ready.agentId).toBe("fake");
    });

    it("streams updates and ends the prompt with end_turn", async () => {
        const { url, projectId } = await setup();
        const client = await connect(url);
        await startChat(client, projectId);

        client.send({ type: "prompt", text: "hello" });
        const done = await waitFor(client.frames, "prompt_done");

        expect(done.stopReason).toBe("end_turn");
        expect(JSON.stringify(client.frames)).toContain(
            "I'll help you with that",
        );
    });

    it("keeps concurrent chats separate", async () => {
        const { url, projectId } = await setup();
        const slow = await connect(url);
        const fast = await connect(url);

        const [slowReady, fastReady] = await Promise.all([
            startChat(slow, projectId),
            startChat(fast, projectId),
        ]);
        expect(slowReady.sessionId).not.toBe(fastReady.sessionId);

        slow.send({ type: "prompt", text: "slow" });
        fast.send({ type: "prompt", text: "hello" });
        await waitFor(fast.frames, "prompt_done");
        await waitFor(slow.frames, "update", (frame) =>
            JSON.stringify(frame).includes("tick"),
        );

        expect(JSON.stringify(slow.frames)).not.toContain(
            "I'll help you with that",
        );
        expect(JSON.stringify(fast.frames)).not.toContain("tick ");

        slow.send({ type: "cancel" });
        const done = await waitFor(slow.frames, "prompt_done");
        expect(done.stopReason).toBe("cancelled");
    });

    it("forwards selected permission options unmapped and cancels with null", async () => {
        const { url, projectId } = await setup();
        const client = await connect(url);
        await startChat(client, projectId);

        client.send({ type: "prompt", text: "permission please" });
        const request = await waitFor(client.frames, "permission_request");
        expect(request.params.options.map((option) => option.optionId)).toEqual([
            "proceed_once",
            "proceed_always",
            "cancel",
        ]);

        client.send({
            type: "permission",
            requestId: request.requestId,
            optionId: "proceed_always",
        });
        expect((await waitFor(client.frames, "prompt_done")).stopReason).toBe(
            "end_turn",
        );
        expect(JSON.stringify(client.frames)).toContain("Change applied.");

        const seen = client.frames.length;
        client.send({ type: "prompt", text: "permission again" });
        const second = await waitFor(
            client.frames,
            "permission_request",
            () => true,
            seen,
        );
        client.send({
            type: "permission",
            requestId: second.requestId,
            optionId: null,
        });
        expect(
            (await waitFor(client.frames, "prompt_done", () => true, seen))
                .stopReason,
        ).toBe("end_turn");
        expect(JSON.stringify(client.frames)).toContain("Change skipped.");
    });

    it("cancel resolves an open permission request and ends the turn", async () => {
        const { url, projectId } = await setup();
        const client = await connect(url);
        await startChat(client, projectId);

        client.send({ type: "prompt", text: "permission please" });
        await waitFor(client.frames, "permission_request");

        client.send({ type: "cancel" });
        const done = await waitFor(client.frames, "prompt_done");

        expect(done.stopReason).toBe("cancelled");
        expect(client.frames.some((frame) => frame.type === "error")).toBe(false);
    });

    it("surfaces an unsupported fs request as method-not-found", async () => {
        const { url, projectId } = await setup();
        const client = await connect(url);
        await startChat(client, projectId);

        client.send({ type: "prompt", text: "unsupported" });
        expect((await waitFor(client.frames, "prompt_done")).stopReason).toBe(
            "end_turn",
        );

        const updates = JSON.stringify(client.frames);
        expect(updates).toContain("fs/read_text_file refused");
        expect(updates).toMatch(/method not found/i);
    });

    it("yields an error with authMethods when the agent requires auth", async () => {
        const agents = [
            { ...preset, env: { FAKE_AGENT_REQUIRE_AUTH: "1" } },
        ];
        const { url, projectId } = await setup(agents);
        const client = await connect(url);

        client.send({ type: "start", projectId, agentId: "fake" });
        const error = await waitFor(client.frames, "error");

        expect(error.authMethods).toEqual([
            { id: "fake-login", name: "Fake login" },
        ]);
        expect((await client.closed).code).toBe(1011);
    });

    it.skipIf(process.platform === "win32")(
        "kills the agent when the socket closes",
        async () => {
            const marker = `foe-marker-${randomUUID()}`;
            const { url, projectId } = await setup([
                { ...preset, args: [...preset.args, marker] },
            ]);
            const client = await connect(url);
            await startChat(client, projectId);
            expect(countProcesses(marker)).toBeGreaterThan(0);

            client.ws.close();

            await waitUntil(() => countProcesses(marker) === 0);
        },
    );

    it.skipIf(process.platform === "win32")(
        "kills a running agent when the socket closes mid-prompt",
        async () => {
            const marker = `foe-marker-${randomUUID()}`;
            const { url, projectId } = await setup([
                { ...preset, args: [...preset.args, marker] },
            ]);
            const client = await connect(url);
            await startChat(client, projectId);

            client.send({ type: "prompt", text: "slow" });
            await waitFor(client.frames, "update", (frame) =>
                JSON.stringify(frame).includes("tick"),
            );
            expect(countProcesses(marker)).toBeGreaterThan(0);

            client.ws.close();

            await waitUntil(() => countProcesses(marker) === 0);
        },
    );

    it("closes invalid messages with 4001 and a missing start with 4000", async () => {
        const { url } = await setup();

        const invalid = await connect(url);
        invalid.ws.send("not json");
        expect((await invalid.closed).code).toBe(4001);

        const unknown = await connect(url);
        unknown.ws.send(JSON.stringify({ type: "nope" }));
        expect((await unknown.closed).code).toBe(4001);

        const idle = await connect(url);
        expect((await idle.closed).code).toBe(4000);
    }, 15_000);

    it.skipIf(process.platform === "win32")(
        "kills every live agent when the app closes",
        async () => {
            const marker = `foe-marker-${randomUUID()}`;
            const { app, url, projectId } = await setup([
                { ...preset, args: [...preset.args, marker] },
            ]);
            const first = await connect(url);
            const second = await connect(url);
            await Promise.all([
                startChat(first, projectId),
                startChat(second, projectId),
            ]);
            expect(countProcesses(marker)).toBeGreaterThanOrEqual(2);

            await app.close();

            await waitUntil(() => countProcesses(marker) === 0);
        },
    );
});

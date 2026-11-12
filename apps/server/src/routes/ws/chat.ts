import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import type WebSocket from "ws";
import { createChat } from "../../lib/chat.js";

const HEARTBEAT_MS = 30_000;

// Server pings every 30s; a socket that misses a pong is terminated.
function heartbeat(ws: WebSocket) {
    let alive = true;
    ws.on("pong", () => {
        alive = true;
    });

    const timer = setInterval(() => {
        if (!alive) {
            ws.terminate();
            return;
        }
        alive = false;
        ws.ping();
    }, HEARTBEAT_MS);
    timer.unref();

    ws.on("close", () => clearInterval(timer));
}

const chatRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.get("/ws", { websocket: true }, (socket) => {
        heartbeat(socket);
        createChat(fastify, socket);
    });
};

export { chatRoutes };

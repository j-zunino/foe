# M3.03 — WebSocket route

Status: done
Milestone: [M3](README.md)
Refs: [WebSocket](../reference/protocol.md#websocket)

## Goal

Expose `GET /ws` and hand the socket to the chat handler.

## Changes

- `apps/server/src/routes/ws/chat.ts` (new)
- `apps/server/src/routes/index.ts` (REST under `/api`, chat at `/ws`)
- `apps/server/src/lib/fastify.ts` (websocket plugin + routes plugin)
- `apps/server/src/index.ts` (no longer registers routes)
- `apps/server/src/lib/chat.ts` (narrowed app parameter for the route)

All routes are declared in `routes/index.ts`. `buildApp` registers `@fastify/websocket` and that one `routes` plugin, so `index.ts` and every integration test get `/api/*` and `/ws` from the same factory.

## Tasks

- [x] Register `@fastify/websocket` with `maxPayload: acp.DEFAULT_MAX_MESSAGE_BYTES`
- [x] Register `GET /ws`
- [x] Hand the socket to `createChat(...)`
- [x] Parse client messages with the protocol schema (M3.02, in `chat.ts`)
- [x] Close with `4001` on invalid JSON or unknown/invalid messages (M3.02)
- [x] Close with `4000` when `start` is missing after 10 seconds (M3.02)
- [x] Ping every 30 seconds and terminate stale sockets
- [x] Close all chats on `onClose`

## Done when

- [x] Typecheck passes
- [x] A WebSocket client can connect and send `start` (verified with `ws`)
- [x] Invalid messages close with the documented codes

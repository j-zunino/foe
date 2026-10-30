# M3.03 — WebSocket route

Status: todo
Milestone: [M3](README.md)
Refs: [WebSocket](../reference/protocol.md#websocket)

## Goal

Expose `GET /ws` and hand the socket to the chat handler.

## Changes

- `apps/server/src/routes/ws/chat.ts` (new)
- `apps/server/src/routes/index.ts`
- `apps/server/src/lib/fastify.ts`
- `apps/server/src/index.ts`

## Tasks

- [ ] Register `@fastify/websocket` with `maxPayload: acp.DEFAULT_MAX_MESSAGE_BYTES`
- [ ] Register `GET /ws`
- [ ] Hand the socket to `createChat(...)`
- [ ] Parse client messages with the protocol schema
- [ ] Close with `4001` on invalid JSON or unknown/invalid messages
- [ ] Close with `4000` when `start` is missing after 10 seconds
- [ ] Ping every 30 seconds and terminate stale sockets
- [ ] Close all chats on `onClose`

## Done when

- [ ] Typecheck passes
- [ ] `wscat` can connect and send `start`
- [ ] Invalid messages close with the documented codes

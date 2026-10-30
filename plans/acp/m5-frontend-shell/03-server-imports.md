# M5.03 — Server imports from the protocol package

Status: todo
Milestone: [M5](README.md)
Refs: [Architecture](../reference/architecture.md#repository-layout)

## Goal

The server consumes the shared protocol package instead of a local copy.

## Changes

- `apps/server/src/lib/chat.ts`
- `apps/server/src/routes/ws/chat.ts`
- `apps/server/package.json`

## Tasks

- [ ] Import client and server message types from `@repo/protocol`
- [ ] Remove `apps/server/src/protocol.ts`
- [ ] Add the workspace dependency
- [ ] Keep the WebSocket behavior unchanged

## Done when

- [ ] Typecheck passes
- [ ] Integration tests still pass
- [ ] No local protocol module remains

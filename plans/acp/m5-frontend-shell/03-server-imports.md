# M5.03 — Server imports from the protocol package

Status: done
Milestone: [M5](README.md)
Refs: [Architecture](../reference/architecture.md#repository-layout)

## Goal

The server consumes the shared protocol package instead of a local copy.

## Changes

- `apps/server/src/lib/chat.ts`
- `apps/server/src/routes/ws/chat.ts`
- `apps/server/package.json`

## Tasks

- [x] Import client and server message types from `@repo/protocol`
- [x] Remove `apps/server/src/protocol.ts`
- [x] Add the workspace dependency
- [x] Keep the WebSocket behavior unchanged

## Done when

- [x] Typecheck passes
- [x] Integration tests still pass
- [x] No local protocol module remains

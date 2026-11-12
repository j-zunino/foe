# M3.01 — Protocol types

Status: done
Milestone: [M3](README.md)
Refs: [WebSocket](../reference/protocol.md#websocket)

## Goal

Define the browser-facing message contract in one place.

## Changes

- `packages/protocol/src/ws.ts` (new)
- `packages/protocol/src/index.ts`
- `packages/protocol/package.json`

The contract lives in the shared protocol package (not `apps/server/src/protocol.ts`) so the frontend in M5–M7 imports the same types.

## Tasks

- [x] Add a zod discriminated union for `ClientMessage`
- [x] Add `ServerMessage` and `AuthMethodSummary` types
- [x] Import ACP types type-only from `@agentclientprotocol/sdk`
- [x] Keep `optionId: null` as the permission-cancel path
- [x] Export the types used by the chat handler and tests

## Done when

- [x] Typecheck passes
- [x] `docs/protocol.md` can quote this file directly
- [x] Invalid client messages can be rejected with one schema

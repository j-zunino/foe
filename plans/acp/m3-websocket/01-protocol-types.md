# M3.01 — Protocol types

Status: todo
Milestone: [M3](README.md)
Refs: [WebSocket](../reference/protocol.md#websocket)

## Goal

Define the browser-facing message contract in one place.

## Changes

- `apps/server/src/protocol.ts` (new)

## Tasks

- [ ] Add a zod discriminated union for `ClientMessage`
- [ ] Add `ServerMessage` and `AuthMethodSummary` types
- [ ] Import ACP types type-only from `@agentclientprotocol/sdk`
- [ ] Keep `optionId: null` as the permission-cancel path
- [ ] Export the types used by the chat handler and tests

## Done when

- [ ] Typecheck passes
- [ ] `docs/protocol.md` can quote this file directly
- [ ] Invalid client messages can be rejected with one schema

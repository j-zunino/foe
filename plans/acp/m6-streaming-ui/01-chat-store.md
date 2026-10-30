# M6.01 — Chat store and socket lifecycle

Status: todo
Milestone: [M6](README.md)
Refs: [Connection lifecycle](../reference/frontend.md#connection-lifecycle)

## Goal

Own chat state and socket events in one reducer-driven store.

## Changes

- `apps/web/src/chat-store.ts` (new)
- `apps/web/src/App.tsx`

## Tasks

- [ ] Add the `Chat` and `ChatStatus` types
- [ ] Add a reducer for chats and the selected chat
- [ ] `createChat` opens `/ws` and sends `start`
- [ ] Keep sockets open while switching chats
- [ ] Handle `ready`, `prompt_done`, `cancel`, `error`, and `closed`
- [ ] Set the title from the first prompt, truncated
- [ ] Do not reconnect automatically

## Done when

- [ ] Typecheck passes
- [ ] Background chats keep streaming while another chat is selected
- [ ] A closed socket marks the chat ended

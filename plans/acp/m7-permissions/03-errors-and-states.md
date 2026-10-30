# M7.03 — Errors and ended states

Status: todo
Milestone: [M7](README.md)
Refs: [Frontend](../reference/frontend.md#state), [WebSocket](../reference/protocol.md#websocket)

## Goal

Surface failures clearly and disable input when a chat cannot continue.

## Changes

- `apps/web/src/components/ChatView.tsx`
- `apps/web/src/components/PromptInput.tsx`
- `apps/web/src/chat-store.ts`

## Tasks

- [ ] Show `error.message` in a banner
- [ ] Show `error.detail` when present
- [ ] Show auth method names and the CLI login hint
- [ ] `closed` marks the chat ended
- [ ] Ended and error chats disable input
- [ ] Agent exit shows an ended/error state

## Done when

- [ ] Auth failures tell the user what login to run
- [ ] Agent exit disables input
- [ ] Errors do not crash the app

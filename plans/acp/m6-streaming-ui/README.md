# M6 — Streaming chat UI

Status: todo
Depends on: M5
Refs: [Frontend](../reference/frontend.md#chat-items), [Frontend](../reference/frontend.md#connection-lifecycle)

## Goal

Render streaming agent updates and prompts in the correct chat without stopping background chats.

## Steps

- [ ] [M6.01 Chat store](01-chat-store.md)
- [ ] [M6.02 Update rendering](02-update-rendering.md)
- [ ] [M6.03 Chat view and input](03-chat-view-input.md)
- [ ] [M6.04 Acceptance](04-acceptance.md)

## Milestone done when

- [ ] Prompts stream live into the correct chat
- [ ] Switching chats does not stop background streams
- [ ] Multiple chats stream independently
- [ ] Tool calls and plans render without breaking; unknown updates are ignored

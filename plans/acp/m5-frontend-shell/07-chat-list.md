# M5.07 — Chat list and new chat

Status: todo
Milestone: [M5](README.md)
Refs: [Components](../reference/frontend.md#components), [Connection lifecycle](../reference/frontend.md#connection-lifecycle)

## Goal

Create a chat per agent preset and open its socket.

## Changes

- `apps/web/src/components/ChatList.tsx` (new)
- `apps/web/src/App.tsx`

## Tasks

- [ ] List chats for the selected project
- [ ] New-chat button with an agent picker
- [ ] Default the picker to the first preset
- [ ] Create the chat in state with status `starting`
- [ ] Open `/ws` and send `start` on open
- [ ] Show a running indicator per chat

## Done when

- [ ] Creating a chat opens a socket and reaches `ready`
- [ ] Chats are grouped by project
- [ ] Switching projects changes the list

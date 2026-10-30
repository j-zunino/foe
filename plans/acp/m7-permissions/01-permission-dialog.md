# M7.01 — Permission dialog

Status: todo
Milestone: [M7](README.md)
Refs: [Components](../reference/frontend.md#components), [WebSocket](../reference/protocol.md#websocket)

## Goal

Let the user answer agent permission requests with the agent's own option IDs.

## Changes

- `apps/web/src/components/PermissionDialog.tsx` (new)
- `apps/web/src/chat-store.ts`

## Tasks

- [ ] Store the pending permission request on the chat
- [ ] Show the tool title and options
- [ ] Group options by `kind`: `allow_once`, `allow_always`, `reject_once`, `reject_always`
- [ ] Render option IDs and labels exactly as received
- [ ] Send `permission` with the selected `optionId`
- [ ] Cancel sends `optionId: null`
- [ ] Never hardcode IDs such as `proceed_once`

## Done when

- [ ] Allow and reject reach the agent with its own IDs
- [ ] Cancel resolves the request as cancelled
- [ ] The dialog dismisses after answering

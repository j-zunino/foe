# M7.02 — Stop and cancel

Status: todo
Milestone: [M7](README.md)
Refs: [Connection lifecycle](../reference/frontend.md#connection-lifecycle)

## Goal

Stop a running prompt and dismiss any open permission dialog.

## Changes

- `apps/web/src/components/PromptInput.tsx`
- `apps/web/src/components/ChatView.tsx`
- `apps/web/src/chat-store.ts`

## Tasks

- [ ] Stop sends `{ type: "cancel" }`
- [ ] Show an optimistic “cancelling” state
- [ ] `prompt_done` with `cancelled` restores `idle`
- [ ] Dismiss the permission dialog on cancel
- [ ] Keep the socket open after cancel

## Done when

- [ ] Stop returns the prompt to idle
- [ ] Any open permission dialog is dismissed
- [ ] The agent stops the slow prompt

# M6.03 — Chat view and prompt input

Status: todo
Milestone: [M6](README.md)
Refs: [Components](../reference/frontend.md#components)

## Goal

Read and send prompts in a scrollable chat view.

## Changes

- `apps/web/src/components/ChatView.tsx` (new)
- `apps/web/src/components/PromptInput.tsx` (new)
- `apps/web/src/App.tsx`

## Tasks

- [ ] Render the selected chat's items
- [ ] Auto-scroll unless the user scrolled up
- [ ] Show the status line and error banner
- [ ] Textarea sends on Enter and inserts a newline on Shift+Enter
- [ ] Disable input while running
- [ ] Add a Stop button
- [ ] Send `prompt` messages over the chat socket

## Done when

- [ ] Prompts stream live into the correct chat
- [ ] Switching chats does not stop background streams
- [ ] Multiple chats stream independently

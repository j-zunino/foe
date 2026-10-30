# M6.02 — Update rendering

Status: todo
Milestone: [M6](README.md)
Refs: [Chat items](../reference/frontend.md#chat-items)

## Goal

Render the useful `SessionUpdate` variants and ignore the rest safely.

## Changes

- `apps/web/src/chat-store.ts`
- `apps/web/src/components/ChatView.tsx`

## Tasks

- [ ] Append `agent_message_chunk` by `messageId` or the last open message
- [ ] Render `agent_thought_chunk` as a collapsed block
- [ ] Append `user_message_chunk`
- [ ] Render tool cards keyed by `toolCallId`
- [ ] Merge `tool_call_update` fields
- [ ] Replace the plan on `plan`
- [ ] Update the title on `session_info_update`
- [ ] Render a minimal line for usage/notice/compaction
- [ ] Ignore `available_commands_update`, `current_mode_update`, `config_option_update`
- [ ] Ignore unknown `sessionUpdate` values

## Done when

- [ ] Tool calls and plans render without breaking
- [ ] Unknown updates do not crash
- [ ] Text chunks group correctly

# M3.02 — Chat handler

Status: todo
Milestone: [M3](README.md)
Refs: [Chat handler](../reference/backend.md#chat-handler)

## Goal

One socket owns one chat, one agent process, and one ACP session.

## Changes

- `apps/server/src/lib/chat.ts` (new)

## Tasks

- [ ] Add the `Chat` interface and module-level `chats` map
- [ ] Enforce `start` within 10 seconds
- [ ] Resolve project and preset; fail with an `error` frame when missing
- [ ] Spawn, initialize, create a session, register the chat, and send `ready`
- [ ] Reject `prompt` while running; send `prompt_done` or `error`
- [ ] Track pending permissions by request id
- [ ] Resolve permissions as cancelled on `cancel`, then forward `session/cancel`
- [ ] On close/error: cancel permissions, tear down, clear timers, remove the chat
- [ ] On agent exit: send `closed` with the stderr tail and close the socket
- [ ] On auth failure: send `error` with `authMethods` and close
- [ ] Tear down every chat on app shutdown
- [ ] Guard the close-during-initialize race

## Done when

- [ ] Typecheck passes
- [ ] Integration tests in M3.04 pass
- [ ] A chat cannot leak its agent process on disconnect

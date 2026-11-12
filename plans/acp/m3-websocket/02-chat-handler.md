# M3.02 — Chat handler

Status: done
Milestone: [M3](README.md)
Refs: [Chat handler](../reference/backend.md#chat-handler)

## Goal

One socket owns one chat, one agent process, and one ACP session.

## Changes

- `apps/server/src/lib/chat.ts` (new)
- `apps/server/src/lib/agent-process.ts` (`onExit` and `signal` options)
- `apps/server/src/lib/fastify.ts` (teardown in `onClose`)

## Tasks

- [x] Add the `Chat` interface and module-level `chats` map
- [x] Enforce `start` within 10 seconds
- [x] Resolve project and preset; fail with an `error` frame when missing
- [x] Spawn, initialize, create a session, register the chat, and send `ready`
- [x] Reject `prompt` while running; send `prompt_done` or `error`
- [x] Track pending permissions by request id
- [x] Resolve permissions as cancelled on `cancel`, then forward `session/cancel`
- [x] On close/error: cancel permissions, tear down, clear timers, remove the chat
- [x] On agent exit: send `closed` with the stderr tail and close the socket
- [x] On auth failure: send `error` with `authMethods` and close
- [x] Tear down every chat on app shutdown
- [x] Guard the close-during-initialize race

## Done when

- [x] Typecheck passes
- [ ] Integration tests in M3.04 pass
- [x] A chat cannot leak its agent process on disconnect

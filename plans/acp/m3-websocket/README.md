# M3 — WebSocket chat protocol

Status: todo
Depends on: M2
Refs: [Protocol](../reference/protocol.md#websocket), [Backend](../reference/backend.md#chat-handler), [Testing](../reference/testing.md#integration-tests)

## Goal

Expose one chat per socket with start, prompt, permission, cancel, and teardown.

## Steps

- [x] [M3.01 Protocol types](01-protocol-types.md)
- [x] [M3.02 Chat handler](02-chat-handler.md)
- [x] [M3.03 WebSocket route](03-ws-route.md)
- [ ] [M3.04 Integration tests](04-integration-tests.md)

## Milestone done when

- [ ] All integration scenarios in [Testing](../reference/testing.md#integration-tests) pass
- [ ] A `wscat` session can drive a full prompt and a permission request
- [ ] Cancel resolves an open permission request before ending the turn
- [ ] Two chats run concurrently
- [ ] Invalid messages close the socket with the documented codes

# M4.05 — Protocol documentation and freeze

Status: todo
Milestone: [M4](README.md)
Refs: [Wire protocol](../reference/protocol.md)

## Goal

Document the WS protocol and freeze it for v1.

## Changes

- `docs/protocol.md` (new)

## Tasks

- [ ] List the four client messages and all server messages
- [ ] State the one-chat-per-socket rule
- [ ] Document the start timeout, close codes, payload limit, and heartbeat
- [ ] Document permission correlation and the `optionId: null` cancel path
- [ ] Document cancel semantics: permissions become `cancelled` before `session/cancel`
- [ ] Document the error frame, including `authMethods`
- [ ] State that the browser never speaks ACP
- [ ] Mark the protocol frozen and name `@agentclientprotocol/sdk` 2.1.0

## Done when

- [ ] The document matches `apps/server/src/protocol.ts`
- [ ] It contains the frozen statement and SDK version

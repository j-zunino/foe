# M4.05 — Protocol documentation and freeze

Status: done
Milestone: [M4](README.md)
Refs: [Wire protocol](../reference/protocol.md)

## Goal

Document the WS protocol and freeze it for v1.

## Changes

- `docs/protocol.md` (new)

## Tasks

- [x] List the four client messages and all server messages
- [x] State the one-chat-per-socket rule
- [x] Document the start timeout, close codes, payload limit, and heartbeat
- [x] Document permission correlation and the `optionId: null` cancel path
- [x] Document cancel semantics: permissions become `cancelled` before `session/cancel`
- [x] Document the error frame, including `authMethods`
- [x] State that the browser never speaks ACP
- [x] Mark the protocol frozen and name `@agentclientprotocol/sdk` 2.1.0

## Done when

- [x] The document matches `packages/protocol/src/ws.ts`
- [x] It contains the frozen statement and SDK version

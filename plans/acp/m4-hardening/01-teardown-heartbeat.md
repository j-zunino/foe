# M4.01 — Teardown and heartbeat

Status: done
Milestone: [M4](README.md)
Refs: [Chat handler](../reference/backend.md#chat-handler), [Security and risks](../reference/security-and-risks.md)

## Goal

No agent process survives shutdown or a dead socket.

## Changes

- `apps/server/src/index.ts`
- `apps/server/src/lib/chat.ts`
- `apps/server/src/routes/ws/chat.ts`

Implemented in M3.02/M3.03; this step is verification only.

## Tasks

- [x] `onClose` tears down every live chat
- [x] Socket close resolves permissions, kills the agent, and clears timers
- [x] Ping every 30 seconds; terminate a socket that misses a pong
- [x] Closing a chat removes it from the chat map

## Done when

- [x] `Ctrl+C` leaves no orphan agents
- [x] A stale socket is cleaned up after the heartbeat timeout
- [x] `ps` shows no agent after teardown

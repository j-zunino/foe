# M4.01 — Teardown and heartbeat

Status: todo
Milestone: [M4](README.md)
Refs: [Chat handler](../reference/backend.md#chat-handler), [Security and risks](../reference/security-and-risks.md)

## Goal

No agent process survives shutdown or a dead socket.

## Changes

- `apps/server/src/index.ts`
- `apps/server/src/lib/chat.ts`
- `apps/server/src/routes/ws/chat.ts`

## Tasks

- [ ] `onClose` tears down every live chat
- [ ] Socket close resolves permissions, kills the agent, and clears timers
- [ ] Ping every 30 seconds; terminate a socket that misses a pong
- [ ] Closing a chat removes it from the chat map

## Done when

- [ ] `Ctrl+C` leaves no orphan agents
- [ ] A stale socket is cleaned up after the heartbeat timeout
- [ ] `ps` shows no agent after teardown

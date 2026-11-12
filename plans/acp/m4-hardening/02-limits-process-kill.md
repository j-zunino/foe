# M4.02 — Limits and process kill

Status: done
Milestone: [M4](README.md)
Refs: [Security and risks](../reference/security-and-risks.md)

## Goal

Keep the browser and agent payload limits aligned and make process cleanup reliable.

## Changes

- `apps/server/src/lib/agent-process.ts`
- `apps/server/src/routes/ws/chat.ts`
- `apps/server/src/index.ts`

## Tasks

- [x] WS `maxPayload` uses `acp.DEFAULT_MAX_MESSAGE_BYTES`
- [x] `ndJsonStream` uses the same limit
- [x] POSIX kill targets the process group
- [x] Windows fallback uses `taskkill /pid <pid> /T /F`
- [x] Add a test that kills a running agent

## Done when

- [x] The two payload limits cannot drift
- [x] Agent teardown works on POSIX and has a Windows fallback
- [x] The kill test passes

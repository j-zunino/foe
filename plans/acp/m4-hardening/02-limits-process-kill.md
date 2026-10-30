# M4.02 — Limits and process kill

Status: todo
Milestone: [M4](README.md)
Refs: [Security and risks](../reference/security-and-risks.md)

## Goal

Keep the browser and agent payload limits aligned and make process cleanup reliable.

## Changes

- `apps/server/src/lib/agent-process.ts`
- `apps/server/src/routes/ws/chat.ts`
- `apps/server/src/index.ts`

## Tasks

- [ ] WS `maxPayload` uses `acp.DEFAULT_MAX_MESSAGE_BYTES`
- [ ] `ndJsonStream` uses the same limit
- [ ] POSIX kill targets the process group
- [ ] Windows fallback uses `taskkill /pid <pid> /T /F`
- [ ] Add a test that kills a running agent

## Done when

- [ ] The two payload limits cannot drift
- [ ] Agent teardown works on POSIX and has a Windows fallback
- [ ] The kill test passes

# M2.03 — Prompt, cancel, permissions, teardown

Status: todo
Milestone: [M2](README.md)
Refs: [Agent process](../reference/backend.md#agent-process)

## Goal

Complete the ACP client surface: prompt, one in-flight turn, permission answers, cancel, and process cleanup.

## Changes

- `apps/server/src/lib/agent-process.ts`

## Tasks

- [ ] Send prompts as `[{ type: "text", text }]`
- [ ] Reject a second prompt while one is running
- [ ] Answer permissions with `{ outcome: { outcome: "selected", optionId } }` or `{ outcome: { outcome: "cancelled" } }`
- [ ] Resolve open permissions as cancelled before `session/cancel`
- [ ] Send `session/cancel` as a notification
- [ ] Tear down in order: permissions, `connection.close()`, `SIGTERM`, then `SIGKILL` after 3 seconds
- [ ] Kill the process group on POSIX; use `taskkill` fallback on Windows
- [ ] Surface initialize/session failures as an error with the stderr tail

## Done when

- [ ] The fake agent completes a prompt and a permission round-trip
- [ ] Cancel ends a slow prompt as `cancelled`
- [ ] No child process survives teardown

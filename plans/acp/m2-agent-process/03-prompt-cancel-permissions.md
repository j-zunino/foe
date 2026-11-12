# M2.03 — Prompt, cancel, permissions, teardown

Status: done
Milestone: [M2](README.md)
Refs: [Agent process](../reference/backend.md#agent-process)

## Goal

Complete the ACP client surface: prompt, one in-flight turn, permission answers, cancel, and process cleanup.

## Changes

- `apps/server/src/lib/agent-process.ts`

## Tasks

- [x] Send prompts as `[{ type: "text", text }]`
- [x] Reject a second prompt while one is running
- [x] Answer permissions with `{ outcome: { outcome: "selected", optionId } }` or `{ outcome: { outcome: "cancelled" } }`
- [x] Resolve open permissions as cancelled before `session/cancel`
- [x] Send `session/cancel` as a notification
- [x] Tear down in order: permissions, `connection.close()`, `SIGTERM`, then `SIGKILL` after 3 seconds
- [x] Kill the process group on POSIX; use `taskkill` fallback on Windows
- [x] Surface initialize/session failures as an error with the stderr tail

## Done when

- [x] The fake agent completes a prompt and a permission round-trip
- [x] Cancel ends a slow prompt as `cancelled`
- [x] No child process survives teardown

# M2.04 — Script-level test

Status: todo
Milestone: [M2](README.md)
Refs: [Testing](../reference/testing.md#integration-tests)

## Goal

Prove the agent process works end to end before adding the WebSocket layer.

## Changes

- `apps/server/src/lib/agent-process.test.ts` (new)

## Tasks

- [ ] Spawn the fake agent and receive a prompt response
- [ ] Round-trip a permission request using the fake option IDs
- [ ] Cancel a slow prompt and get `cancelled`
- [ ] Assert an auth-required run reports auth methods
- [ ] Assert an `fs/*` call from the fake agent does not perform filesystem work
- [ ] Kill the process and verify no child remains

## Done when

- [ ] `pnpm --filter @repo/server test` passes
- [ ] The test leaves no orphan processes

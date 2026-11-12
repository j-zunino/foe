# M3.04 — WebSocket integration tests

Status: done
Milestone: [M3](README.md)
Refs: [Integration tests](../reference/testing.md#integration-tests)

## Goal

Cover the full socket protocol against the fake agent.

## Changes

- `apps/server/src/lib/chat.test.ts` (new)

## Tasks

- [x] `start` returns `ready` with a session id
- [x] A prompt streams updates and ends with `prompt_done: end_turn`
- [x] Two concurrent chats get distinct sessions and do not cross-deliver
- [x] Permission selection resolves `selected`; Cancel resolves `cancelled`
- [x] Option IDs are forwarded unmapped
- [x] Cancel resolves an open permission and returns `cancelled`
- [x] A `fs/*` call surfaces as method-not-found
- [x] Auth-required mode yields an `error` with `authMethods`
- [x] Closing the socket kills the agent within the timeout
- [x] Invalid messages close with `4001`; missing `start` closes with `4000`
- [x] `app.close()` kills every live agent

## Done when

- [x] `pnpm --filter @repo/server test` passes
- [x] No orphan processes remain after the suite

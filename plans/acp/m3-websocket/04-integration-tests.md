# M3.04 — WebSocket integration tests

Status: todo
Milestone: [M3](README.md)
Refs: [Integration tests](../reference/testing.md#integration-tests)

## Goal

Cover the full socket protocol against the fake agent.

## Changes

- `apps/server/src/lib/chat.test.ts` (new)

## Tasks

- [ ] `start` returns `ready` with a session id
- [ ] A prompt streams updates and ends with `prompt_done: end_turn`
- [ ] Two concurrent chats get distinct sessions and do not cross-deliver
- [ ] Permission selection resolves `selected`; Cancel resolves `cancelled`
- [ ] Option IDs are forwarded unmapped
- [ ] Cancel resolves an open permission and returns `cancelled`
- [ ] A `fs/*` call surfaces as method-not-found
- [ ] Auth-required mode yields an `error` with `authMethods`
- [ ] Closing the socket kills the agent within the timeout
- [ ] Invalid messages close with `4001`; missing `start` closes with `4000`
- [ ] `app.close()` kills every live agent

## Done when

- [ ] `pnpm --filter @repo/server test` passes
- [ ] No orphan processes remain after the suite

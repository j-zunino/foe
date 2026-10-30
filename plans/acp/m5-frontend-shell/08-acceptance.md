# M5.08 — M5 acceptance

Status: todo
Milestone: [M5](README.md)
Refs: [Testing](../reference/testing.md#manual-checks)

## Goal

Verify the shell builds and talks to the frozen backend.

## Changes

- No new files

## Tasks

- [ ] `pnpm install`
- [ ] `pnpm build` builds protocol before server and web
- [ ] `pnpm typecheck` and `pnpm lint` pass across the workspace
- [ ] `pnpm --filter @repo/web dev` loads in the browser
- [ ] Add and remove a project from the UI
- [ ] Create a chat and reach `ready`
- [ ] Confirm the server sees the WS `start`

## Done when

- [ ] All tasks pass
- [ ] No protocol changes were needed

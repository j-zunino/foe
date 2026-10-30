# M5.05 — API client and app state

Status: todo
Milestone: [M5](README.md)
Refs: [State](../reference/frontend.md#state)

## Goal

Load projects and agents and keep the selected project across reloads.

## Changes

- `apps/web/src/api.ts` (new)
- `apps/web/src/App.tsx`

## Tasks

- [ ] Fetch `GET /api/projects` and `GET /api/agents`
- [ ] Hold `projects`, `agents`, `chats`, and `selectedChatId` in `App`
- [ ] Persist `selectedProjectId` in `localStorage`
- [ ] Add a typed project/agent summary shape from `@repo/protocol` or the API
- [ ] Handle fetch errors with a visible message

## Done when

- [ ] Projects and agents render from the backend
- [ ] The selected project survives a reload
- [ ] Typecheck passes

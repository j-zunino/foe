# M5.05 — API client and app state

Status: done
Milestone: [M5](README.md)
Refs: [State](../reference/frontend.md#state)

## Goal

Load projects and agents and keep the selected project across reloads.

## Changes

- `apps/web/src/features/projects/*` (new)
- `apps/web/src/features/agents/*` (new)
- `apps/web/src/lib/query-client.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`

## Tasks

- [x] Fetch `GET /api/projects` and `GET /api/agents`
- [x] Hold `projects` and `agents` in `App` (`chats`/`selectedChatId` land in M5.07)
- [x] Use typed project/agent shapes from `@repo/protocol`
- [x] Handle fetch errors with a visible toast

## Done when

- [x] Projects and agents render from the backend
- [x] Typecheck passes

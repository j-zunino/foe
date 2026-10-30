# M0.01 — App factory

Status: done
Milestone: [M0](README.md)
Refs: [Bootstrap](../reference/backend.md#bootstrap)

## Goal

One app factory used by the server entrypoint and every test.

## Changes

- `apps/server/src/lib/fastify.ts`
- `apps/server/src/index.ts`

## Tasks

- [x] Move Fastify creation into `buildApp()`
- [x] Set `bodyLimit` to 1 MiB in `buildApp`
- [x] Decorate `db` and `sqlite`
- [x] Add an `onClose` hook that closes SQLite
- [x] Use `buildApp()` from `index.ts`

## Done when

- [x] `pnpm --filter @repo/server typecheck` passes
- [x] The server boots and `/api/health` responds

# M1.02 — Fastify DB decorators

Status: done
Milestone: [M1](README.md)
Refs: [Bootstrap](../reference/backend.md#bootstrap)

## Goal

The app owns the database handle and closes it on shutdown.

## Changes

- `apps/server/src/lib/fastify.ts`
- `apps/server/src/index.ts`

## Tasks

- [x] `buildApp(database)` accepts the `DatabaseHandle`
- [x] Decorate `db` and `sqlite`
- [x] Augment the Fastify instance types
- [x] Close SQLite in `onClose`
- [x] Pass the `createDatabase()` result from `index.ts`

## Done when

- [x] Typecheck passes
- [x] `app.close()` closes the database

# M1.07 — Route registration and decorators

Status: done
Milestone: [M1](README.md)
Refs: [Bootstrap](../reference/backend.md#bootstrap)

## Goal

Wire the project store and presets into the app and register the REST routes.

## Changes

- `apps/server/src/routes/index.ts`
- `apps/server/src/lib/fastify.ts`
- `apps/server/src/index.ts`

## Tasks

- [x] Decorate `agents` with the resolved presets
- [x] Augment the Fastify types for both decorators (`agents` done in M1.06)
- [x] Register `agentsRoutes` at `/agents`
- [x] Pass presets into `buildApp`

## Done when

- [x] Typecheck passes
- [x] `curl /api/agents` respond
- [x] Integration tests can build the app with fake presets

# M1.07 — Route registration and decorators

Status: todo
Milestone: [M1](README.md)
Refs: [Bootstrap](../reference/backend.md#bootstrap)

## Goal

Wire the project store and presets into the app and register the REST routes.

## Changes

- `apps/server/src/routes/index.ts`
- `apps/server/src/lib/fastify.ts`
- `apps/server/src/index.ts`

## Tasks

- [ ] Decorate `projects` with `createProjectStore(db)`
- [ ] Decorate `agents` with the resolved presets
- [ ] Augment the Fastify types for both decorators
- [ ] Register `projectsRoutes` at `/projects`
- [ ] Register `agentsRoutes` at `/agents`
- [ ] Pass presets into `buildApp`

## Done when

- [ ] Typecheck passes
- [ ] `curl /api/projects` and `/api/agents` respond
- [ ] Integration tests can build the app with fake presets

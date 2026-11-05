# M1 — Projects, SQLite persistence, and agent presets

Status: in progress
Depends on: M0
Refs: [Backend](../reference/backend.md#database), [Protocol](../reference/protocol.md#rest-api), [Testing](../reference/testing.md#unit-tests)

## Goal

Projects persist in SQLite, are exposed over REST, and agent presets are resolved and listed without leaking env.

## Steps

- [x] [M1.01 DB foundation](01-db-foundation.md)
- [x] [M1.02 Fastify DB decorators](02-fastify-db-decorators.md)
- [x] [M1.03 Project store](03-project-store.md)
- [x] [M1.04 Agent preset resolution](04-agent-preset-resolution.md)
- [x] [M1.05 Projects routes](05-projects-routes.md)
- [x] [M1.06 Agents route](06-agents-route.md)
- [x] [M1.07 Route registration](07-route-registration.md)
- [ ] [M1.08 Tests](08-tests.md)

## Milestone done when

- [x] Add/list/delete projects via `curl`; adding with only `path` names the project after the directory basename
- [x] Restart the backend: the project list is still there with the same ids and names; `rm -rf data/` resets it
- [x] Invalid paths and duplicates return `400`/`409`
- [x] Deleting a project removes only the row; the directory survives
- [x] Env values never appear in `GET /api/agents`
- [x] `pnpm --filter @repo/server test` passes without creating `./data/foe.db`

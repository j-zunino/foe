# M1.06 — Agents route

Status: done
Milestone: [M1](README.md)
Refs: [REST API](../reference/protocol.md#rest-api)

## Goal

Expose agent presets as `{ id, name }` without leaking env.

## Changes

- `apps/server/src/routes/api/agents.ts`

## Tasks

- [x] `GET /` reads `fastify.agents`
- [x] Map each preset to `{ id, name }`
- [x] Never serialize the decorated preset array directly
- [x] Add a test asserting `env` is absent

## Done when

- [x] Typecheck passes
- [x] `GET /api/agents` returns only `id` and `name`

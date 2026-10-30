# M1.06 — Agents route

Status: todo
Milestone: [M1](README.md)
Refs: [REST API](../reference/protocol.md#rest-api)

## Goal

Expose agent presets as `{ id, name }` without leaking env.

## Changes

- `apps/server/src/routes/api/agents.ts`

## Tasks

- [ ] `GET /` reads `fastify.agents`
- [ ] Map each preset to `{ id, name }`
- [ ] Never serialize the decorated preset array directly
- [ ] Add a test asserting `env` is absent

## Done when

- [ ] Typecheck passes
- [ ] `GET /api/agents` returns only `id` and `name`

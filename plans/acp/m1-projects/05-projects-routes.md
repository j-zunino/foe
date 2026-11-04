# M1.05 — Projects routes

Status: done
Milestone: [M1](README.md)
Refs: [REST API](../reference/protocol.md#rest-api), [HTTP API](../reference/backend.md#http-api)

## Goal

List, add, and delete projects over REST.

## Changes

- `apps/server/src/routes/api/projects.ts`

## Tasks

- [x] `GET /` returns the project list
- [x] `POST /` validates `{ path, name? }` with zod
- [x] Require an absolute path that exists and is a directory
- [x] Trim a provided name; default to `basename(path)` when omitted
- [x] Return `201` with the created project
- [x] Return `400` for invalid bodies, `409` for duplicates
- [x] `DELETE /:id` returns `204` or `404`
- [x] Delete only the row, never the directory
- [x] Call the `projects` service with `fastify.db`

## Done when

- [x] Typecheck passes
- [x] `curl` can add, list, and delete a project
- [x] Invalid paths and duplicates return `400`/`409`
- [ ] Inject tests in M1.08 pass

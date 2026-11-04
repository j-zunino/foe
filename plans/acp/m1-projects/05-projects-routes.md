# M1.05 — Projects routes

Status: todo
Milestone: [M1](README.md)
Refs: [REST API](../reference/protocol.md#rest-api), [HTTP API](../reference/backend.md#http-api)

## Goal

List, add, and delete projects over REST.

## Changes

- `apps/server/src/routes/api/projects.ts`

## Tasks

- [ ] `GET /` returns the project list
- [ ] `POST /` validates `{ path, name? }` with zod
- [ ] Require an absolute path that exists and is a directory
- [ ] Trim a provided name; default to `basename(path)` when omitted
- [ ] Return `201` with the created project
- [ ] Return `400` for invalid bodies, `409` for duplicates
- [ ] `DELETE /:id` returns `204` or `404`
- [ ] Delete only the row, never the directory
- [ ] Call the `projects` service with `fastify.db`

## Done when

- [ ] Typecheck passes
- [ ] `curl` can add, list, and delete a project
- [ ] Invalid paths and duplicates return `400`/`409`
- [ ] Inject tests in M1.08 pass

# M1.03 — Project store

Status: done
Milestone: [M1](README.md)
Refs: [Project store](../reference/backend.md#project-store), [Protocol](../reference/protocol.md#rest-api)

## Goal

A DB-backed project store with canonical paths and directory validation at write time.

## Changes

- `apps/server/src/services/projects.ts` (new)

## Tasks

- [x] `Project` comes from the protocol schema; the store returns Drizzle rows matching it
- [x] Export a plain `projects` service: `list`, `get`, `add`, `remove`, each taking `db`
- [x] `list` orders by `created_at, id` (no limit)
- [x] Route canonicalizes with `fs.realpath` (via `resolveDirectory`) and defaults `name` to `basename(path)`
- [x] `add` uses `insert(...).onConflictDoNothing().returning()`; a missing row is a duplicate (`409`)
- [x] `remove` deletes by id and returns the removed row; the route answers `204` or `404`
- [x] Keep no in-memory cache; SQLite is the source of truth
- [x] Do not store or compute availability; directory existence is checked at use time

## Done when

- [x] Typecheck passes
- [x] The store matches the reference behavior
- [ ] Unit tests in M1.08 pass

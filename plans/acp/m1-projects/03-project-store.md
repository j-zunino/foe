# M1.03 — Project store

Status: todo
Milestone: [M1](README.md)
Refs: [Project store](../reference/backend.md#project-store), [Protocol](../reference/protocol.md#rest-api)

## Goal

A DB-backed project store with canonical paths and availability computed at read time.

## Changes

- `apps/server/src/lib/projects.ts` (new)

## Tasks

- [ ] Derive `Project` from the Drizzle schema
- [ ] Export `createProjectStore(db)` with `list`, `get`, `add`, `remove`
- [ ] `list` orders by `created_at`, `id` and computes `available` from the directory
- [ ] `add` canonicalizes with `fs.realpath`, defaults `name` to `basename(path)`, and uses `returning()`
- [ ] Map the `path` unique violation to a duplicate error for `409`
- [ ] `remove` deletes by id and reports whether a row was removed
- [ ] Keep no in-memory cache; SQLite is the source of truth

## Done when

- [ ] Typecheck passes
- [ ] The store matches the reference behavior
- [ ] Unit tests in M1.08 pass

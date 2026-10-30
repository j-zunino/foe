# M1.08 — M1 tests

Status: todo
Milestone: [M1](README.md)
Refs: [Unit tests](../reference/testing.md#unit-tests)

## Goal

Cover the database, project store, routes, and preset resolution.

## Changes

- `apps/server/src/lib/db/db.test.ts`
- `apps/server/src/lib/projects.test.ts`
- `apps/server/src/routes/api/projects.test.ts`
- `apps/server/src/lib/agents.test.ts` or `src/config.test.ts`

## Tasks

- [ ] Fresh DB has the migrated table; reopening applies nothing
- [ ] An unusable path throws with the resolved path in the message
- [ ] Project add/list/delete; name default and trim
- [ ] Relative, missing, and non-directory paths are rejected
- [ ] Duplicate canonical paths are rejected
- [ ] A missing project directory reports `available: false` and stays in the list
- [ ] Reopening a temp DB returns the same ids with no duplicates
- [ ] Route inject tests cover `400`, `409`, `404`, `201`, `204`
- [ ] Preset resolution and env stripping are tested
- [ ] Tests use `:memory:` or `mkdtemp`, never `./data/`

## Done when

- [ ] `pnpm --filter @repo/server test` passes
- [ ] No test creates `./data/foe.db`

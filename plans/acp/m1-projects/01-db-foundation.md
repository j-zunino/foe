# M1.01 — DB foundation

Status: done
Milestone: [M1](README.md)
Refs: [Database](../reference/backend.md#database)

## Goal

SQLite with a Drizzle schema and committed migrations, opened at startup.

## Changes

- `apps/server/package.json`
- `apps/server/src/config/env.ts`
- `apps/server/drizzle.config.ts`
- `apps/server/src/lib/db/schema.ts`
- `apps/server/src/lib/db/index.ts`
- `database/migrations/`
- `.gitignore`

## Tasks

- [x] Add `better-sqlite3`, `@types/better-sqlite3`, `drizzle-orm`, `drizzle-kit`
- [x] Add `DATABASE_FILE` with `./data/foe.db` default and `:memory:` passthrough
- [x] Define the `projects` table in `schema.ts`
- [x] Point drizzle-kit at absolute `out` and `dbCredentials.url`
- [x] `createDatabase()` opens the file, sets pragmas, and migrates at startup
- [x] Commit the generated migration
- [x] Ignore `/data/`

## Done when

- [x] Typecheck passes
- [x] A fresh database gets the migrated `projects` table
- [x] Reopening an up-to-date file applies nothing
- [x] Tests can use `:memory:` without touching `./data/`

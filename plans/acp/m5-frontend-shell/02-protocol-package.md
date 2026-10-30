# M5.02 — Shared protocol package

Status: todo
Milestone: [M5](README.md)
Refs: [Architecture](../reference/architecture.md#repository-layout)

## Goal

Move the frozen protocol into `@repo/protocol` with declarations.

## Changes

- `packages/protocol/package.json` (new)
- `packages/protocol/tsconfig.json` (new)
- `packages/protocol/src/index.ts` (new)
- `apps/server/src/protocol.ts` (remove after move)

## Tasks

- [ ] Create `@repo/protocol`
- [ ] Move the message types and zod schema from the server
- [ ] Build to `dist` with declarations
- [ ] Make turbo `^build` order protocol before server and web

## Done when

- [ ] `pnpm build` builds protocol first
- [ ] Both consumers can import the package
- [ ] There is no second copy of the message types

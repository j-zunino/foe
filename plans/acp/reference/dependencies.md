# Dependencies

## Already in the workspace

- Root dev: `typescript`, `prettier`, `turbo`, `eslint` and its plugins.
- Server: `fastify`, `zod`, `@agentclientprotocol/sdk` (2.1.0), `ws`, `@fastify/websocket`, `better-sqlite3` (13.0.3), `drizzle-orm` (0.45.4), `drizzle-kit` (0.31.11), `tsx`, `vitest`, `@types/node`, `@types/ws`, `@types/better-sqlite3` (9.6.0).
- Shared config packages: `@repo/eslint-config`, `@repo/typescript-config`.

`better-sqlite3` 13 is N-API with per-platform prebuilds bundled in the tarball and `gypfile: false`, so `pnpm install` needs no compiler toolchain. It ships no TypeScript declarations, hence `@types/better-sqlite3`. If pnpm reports an ignored build script, add `better-sqlite3` to `onlyBuiltDependencies`/`allowBuilds` in `pnpm-workspace.yaml`.

## Added in M5

Catalog: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`. (`vite` is already in the catalog.)

## Deliberately not added

- HTTP framework other than Fastify
- Async database driver or a second query layer
- Router
- State management library
- UI kit
- Markdown renderer

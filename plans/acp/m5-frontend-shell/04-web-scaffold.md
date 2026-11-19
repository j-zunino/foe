# M5.04 — Web scaffold

Status: done
Milestone: [M5](README.md)
Refs: [Repository layout](../reference/architecture.md#repository-layout), [Frontend](../reference/frontend.md)

## Goal

A Vite + React + TypeScript app with the dev proxy configured.

## Changes

- `apps/web/package.json` (new)
- `apps/web/vite.config.ts` (new)
- `apps/web/tsconfig.json` (new)
- `apps/web/eslint.config.js` (new)
- `apps/web/index.html` (new)
- `apps/web/src/main.tsx` (new)
- `apps/web/src/App.tsx` (new)
- `apps/web/src/index.css` (new)

## Tasks

- [x] Create `@repo/web`
- [x] Extend `@repo/typescript-config/vite.json`
- [x] Use `@repo/eslint-config/react`
- [x] Proxy `/api` and `/ws` to the server
- [x] Add the Vite React plugin
- [x] Render a minimal app shell

## Done when

- [x] `pnpm --filter @repo/web dev` loads in the browser
- [x] `pnpm typecheck` and `pnpm lint` pass
- [x] The proxy reaches the backend

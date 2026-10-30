# M5.04 — Web scaffold

Status: todo
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
- `apps/web/src/styles.css` (new)

## Tasks

- [ ] Create `@repo/web`
- [ ] Extend `@repo/typescript-config/vite.json`
- [ ] Use `@repo/eslint-config/react`
- [ ] Proxy `/api` and `/ws` to the server
- [ ] Add the Vite React plugin
- [ ] Render a minimal app shell

## Done when

- [ ] `pnpm --filter @repo/web dev` loads in the browser
- [ ] `pnpm typecheck` and `pnpm lint` pass
- [ ] The proxy reaches the backend

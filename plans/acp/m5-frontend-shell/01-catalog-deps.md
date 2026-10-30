# M5.01 — Catalog dependencies

Status: todo
Milestone: [M5](README.md)
Refs: [Dependencies](../reference/dependencies.md)

## Goal

Add the React and Vite packages to the workspace catalog.

## Changes

- `pnpm-workspace.yaml`

## Tasks

- [ ] Add `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`
- [ ] Confirm `vite` is already in the catalog
- [ ] Run `pnpm install`

## Done when

- [ ] `pnpm install` succeeds
- [ ] No package versions are duplicated outside the catalog

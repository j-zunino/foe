# M5.01 — Catalog dependencies

Status: done
Milestone: [M5](README.md)
Refs: [Dependencies](../reference/dependencies.md)

## Goal

Add the React and Vite packages to the workspace catalog.

## Changes

- `pnpm-workspace.yaml`

## Tasks

- [x] Add `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`
- [x] Confirm `vite` is already in the catalog
- [x] Run `pnpm install`

## Done when

- [x] `pnpm install` succeeds
- [x] No package versions are duplicated outside the catalog

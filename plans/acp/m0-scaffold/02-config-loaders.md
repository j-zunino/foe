# M0.02 — Config loaders

Status: done
Milestone: [M0](README.md)
Refs: [Config](../reference/backend.md#config)

## Goal

Validated environment and agent-preset loading with repo-root path resolution.

## Changes

- `apps/server/src/config/env.ts`
- `apps/server/src/config/agent.ts`
- `apps/server/src/lib/paths.ts`
- `config/agents.example.json`

## Tasks

- [x] `getRepoRoot()` walks up to `pnpm-workspace.yaml`
- [x] `loadConfig()` validates `HOST`, `PORT`, and `AGENTS_FILE`
- [x] `loadAgents()` validates presets and rejects duplicate ids
- [x] Resolve `./` preset commands and args against the repo root
- [x] Point the fake preset at the workspace-local `tsx`
- [x] A missing `AGENTS_FILE` fails with a message naming the path

## Done when

- [x] `pnpm typecheck` and `pnpm lint` pass
- [x] Missing `AGENTS_FILE` produces the documented error
- [x] `/api/health` still responds

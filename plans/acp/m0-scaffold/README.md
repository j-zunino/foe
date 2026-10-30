# M0 — Server scaffold and config

Status: done
Depends on: —
Refs: [Architecture](../reference/architecture.md), [Backend](../reference/backend.md#bootstrap)

## Goal

Make the server bootable from one app factory with validated config and agent presets.

## Steps

- [x] [M0.01 App factory](01-app-factory.md)
- [x] [M0.02 Config loaders](02-config-loaders.md)
- [x] [M0.03 Preset and workspace verification](03-preset-and-verify.md)

## Milestone done when

- [x] `pnpm install`
- [x] `cp config/agents.example.json config/agents.json`
- [x] `pnpm typecheck` and `pnpm lint`
- [x] `pnpm --filter @repo/server dev`, then `curl http://127.0.0.1:8787/api/health` returns `{ "ok": true }`
- [x] A missing `AGENTS_FILE` fails startup with a message naming the path

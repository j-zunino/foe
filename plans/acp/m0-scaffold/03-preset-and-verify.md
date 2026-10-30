# M0.03 — Preset and workspace verification

Status: done
Milestone: [M0](README.md)
Refs: [Config](../reference/backend.md#config), [Dependencies](../reference/dependencies.md)

## Goal

Confirm a fresh workspace can install, boot, and use the token-free fake preset.

## Changes

- `config/agents.example.json`
- local `config/agents.json` (gitignored)

## Tasks

- [x] Copy `config/agents.example.json` to `config/agents.json`
- [x] `pnpm install`
- [x] `pnpm typecheck` and `pnpm lint`
- [x] `pnpm --filter @repo/server dev`, then `curl http://127.0.0.1:8787/api/health`

## Done when

- [x] Health returns `{ "ok": true }`
- [x] A missing `AGENTS_FILE` fails startup with the path in the message

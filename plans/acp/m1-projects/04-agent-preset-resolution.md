# M1.04 — Agent preset resolution

Status: todo
Milestone: [M1](README.md)
Refs: [Config](../reference/backend.md#config)

## Goal

Preset commands and args that start with `./` resolve against the repo root before spawn.

## Changes

- `apps/server/src/config/agent.ts`
- `config/agents.example.json` if the preset shape changes

## Tasks

- [ ] Resolve `command` and every `args` entry starting with `./` against the repo root
- [ ] Keep bare commands on normal `PATH` lookup
- [ ] Keep the preset `env` for the child and never log it
- [ ] Update the preset file and docs if the shape changes
- [ ] Add tests for resolution from `apps/server` and the repo root

## Done when

- [ ] Typecheck passes
- [ ] A preset with `./` paths works when turbo runs from `apps/server`
- [ ] Bare commands still work
- [ ] `GET /api/agents` will not expose `env`

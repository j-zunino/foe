# M2.02 — Spawn and initialize

Status: todo
Milestone: [M2](README.md)
Refs: [Agent process](../reference/backend.md#agent-process), [SDK notes](../reference/acp-notes.md#sdk-notes)

## Goal

Spawn an agent, wire the ACP stream, initialize, and create a session.

## Changes

- `apps/server/src/lib/agent-process.ts` (new)

## Tasks

- [ ] Spawn the preset command with the project `cwd`, merged env, piped stdio, and `detached` on non-Windows
- [ ] Build the NDJSON stream with output first
- [ ] Register `session/update` and `session/request_permission` handlers
- [ ] Connect synchronously with `app.connect(stream)`
- [ ] Call `initialize` with `protocolVersion` and `fs`/`terminal` set to `false`
- [ ] Call `session/new` with `cwd` and `mcpServers: []`
- [ ] Store the session id after `session/new`
- [ ] Keep `authMethods` in memory
- [ ] Keep the last 8 KiB of stderr in a ring buffer
- [ ] Expose `prompt`, `cancel`, and `close`

## Done when

- [ ] The fake agent initializes and creates a session
- [ ] No `fs/*` or `terminal/*` handler is registered
- [ ] Typecheck passes

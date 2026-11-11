# M2.02 — Spawn and initialize

Status: done
Milestone: [M2](README.md)
Refs: [Agent process](../reference/backend.md#agent-process), [SDK notes](../reference/acp-notes.md#sdk-notes)

## Goal

Spawn an agent, wire the ACP stream, initialize, and create a session.

## Changes

- `apps/server/src/lib/agent-process.ts` (new)

## Tasks

- [x] Spawn the preset command with the project `cwd`, merged env, piped stdio, and `detached` on non-Windows
- [x] Build the NDJSON stream with output first
- [x] Register `session/update` and `session/request_permission` handlers
- [x] Connect synchronously with `app.connect(stream)`
- [x] Call `initialize` with `protocolVersion` and `fs`/`terminal` set to `false`
- [x] Call `session/new` with `cwd` and `mcpServers: []`
- [x] Store the session id after `session/new`
- [x] Keep `authMethods` in memory
- [x] Keep the last 8 KiB of stderr in a ring buffer
- [x] Expose `prompt`, `cancel`, and `close`

## Done when

- [x] The fake agent initializes and creates a session
- [x] No `fs/*` or `terminal/*` handler is registered
- [x] Typecheck passes

# M4.03 — Startup and shutdown logging

Status: todo
Milestone: [M4](README.md)
Refs: [Bootstrap](../reference/backend.md#bootstrap), [Security and risks](../reference/security-and-risks.md)

## Goal

Operators can see what the server bound to and which files it uses.

## Changes

- `apps/server/src/index.ts`

## Tasks

- [ ] Log the bind address and port
- [ ] Log the agents file path
- [ ] Log the resolved database path
- [ ] Warn when `HOST` is not loopback
- [ ] A database open failure names the resolved path
- [ ] Never log preset env values

## Done when

- [ ] Startup logs contain the three paths/addresses
- [ ] Non-loopback binds warn
- [ ] No secret value appears in logs

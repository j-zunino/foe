# M4.03 — Startup and shutdown logging

Status: done
Milestone: [M4](README.md)
Refs: [Bootstrap](../reference/backend.md#bootstrap), [Security and risks](../reference/security-and-risks.md)

## Goal

Operators can see what the server bound to and which files it uses.

## Changes

- `apps/server/src/index.ts`

## Tasks

- [x] Log the bind address and port
- [x] Log the agents file path
- [x] Log the resolved database path
- [x] Warn when `HOST` is not loopback
- [x] A database open failure names the resolved path
- [x] Never log preset env values

## Done when

- [x] Startup logs contain the three paths/addresses
- [x] Non-loopback binds warn
- [x] No secret value appears in logs

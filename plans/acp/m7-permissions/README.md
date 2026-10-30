# M7 — Permissions, cancel, errors

Status: todo
Depends on: M6
Refs: [Frontend](../reference/frontend.md#components), [Protocol](../reference/protocol.md#websocket)

## Goal

Complete the chat UX: permission dialog, Stop, error banner, and ended/error states.

## Steps

- [ ] [M7.01 Permission dialog](01-permission-dialog.md)
- [ ] [M7.02 Stop and cancel](02-stop-cancel.md)
- [ ] [M7.03 Errors and states](03-errors-and-states.md)
- [ ] [M7.04 Acceptance](04-acceptance.md)

## Milestone done when

- [ ] Allow, reject, and cancel permission outcomes reach the agent using the agent's own option IDs
- [ ] Stop returns the prompt to idle and dismisses any open permission dialog
- [ ] An auth failure shows the agent's error plus what CLI login to run
- [ ] Agent exit shows an ended/error state and disables input
- [ ] The manual UI checklist passes

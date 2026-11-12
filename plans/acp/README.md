# ACP Web GUI — Implementation Plan

Local, single-user web GUI that orchestrates multiple ACP coding agents. The backend is a thin ACP client; the browser speaks a small custom WebSocket protocol.

## Status

| Milestone                                               | Status      | Progress | Next step                                       |
| ------------------------------------------------------- | ----------- | -------- | ----------------------------------------------- |
| [M0 — Scaffold and config](m0-scaffold/README.md)       | done        | 3/3      | —                                               |
| [M1 — Projects and presets](m1-projects/README.md)      | in progress | 2/8      | [M1.03](m1-projects/03-project-store.md)        |
| [M2 — Agent process](m2-agent-process/README.md)        | in progress | 3/4      | [M2.04](m2-agent-process/04-script-test.md)     |
| [M3 — WebSocket protocol](m3-websocket/README.md)       | done        | 4/4      | —                                               |
| [M4 — Hardening and docs](m4-hardening/README.md)       | in progress | 5/7      | [M4.04](m4-hardening/04-readme.md)              |
| [M5 — Frontend shell](m5-frontend-shell/README.md)      | todo        | 0/8      | [M5.01](m5-frontend-shell/01-catalog-deps.md)   |
| [M6 — Streaming UI](m6-streaming-ui/README.md)          | todo        | 0/4      | [M6.01](m6-streaming-ui/01-chat-store.md)       |
| [M7 — Permissions and errors](m7-permissions/README.md) | todo        | 0/4      | [M7.01](m7-permissions/01-permission-dialog.md) |

Status values: `todo`, `in progress`, `done`. Update this table when a milestone starts or finishes.

## How to use

1. Pick the next unchecked step in the dashboard.
2. Read the step's goal, changes, and tasks.
3. Implement it, then tick its task checkboxes.
4. Tick the step in the milestone README and update the step's `Status:` line.
5. When every step is done, verify the milestone acceptance criteria and update this dashboard.

## At a glance

- Backend first: M0–M4 finish and freeze the REST/WebSocket protocol.
- UI second: M5–M7 consume the frozen protocol.
- Projects persist in SQLite (`data/foe.db`); chats live in memory per connection.
- Agents own file and terminal tools. The backend advertises no `fs` or `terminal` capability.
- A fake ACP agent makes the whole flow runnable without network or tokens.

## Reference

- [Architecture](reference/architecture.md)
- [Wire protocol](reference/protocol.md)
- [Backend design](reference/backend.md)
- [Frontend design](reference/frontend.md)
- [Testing](reference/testing.md)
- [Dependencies](reference/dependencies.md)
- [Security and risks](reference/security-and-risks.md)
- [ACP notes](reference/acp-notes.md)
- [Open questions](reference/open-questions.md)

## Step template

```md
# Mx.yy — Title

Status: todo
Milestone: [Mx](README.md)
Refs: [Backend design](../reference/backend.md#section)

## Goal

One or two sentences.

## Changes

- `path/to/file.ts` (new)

## Tasks

- [ ] Task

## Done when

- [ ] Check
```

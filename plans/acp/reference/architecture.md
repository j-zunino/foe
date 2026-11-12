# Architecture

## Summary

Build a local, single-user web GUI that orchestrates multiple ACP coding agents.

The backend is a thin ACP client:

- Spawns one agent process per chat over stdio.
- Initializes the ACP connection and creates a session.
- Handles the only client-side request the UI needs: `session/request_permission`.
- Streams agent updates to the browser.
- Advertises no filesystem or terminal capabilities, so agents use their own tools.

The browser never speaks ACP. It uses a small custom WebSocket protocol for one chat at a time, plus a REST API for projects and agent presets.

## Delivery order

The backend and its wire protocol are finished and documented before any React is written. M4 freezes the protocol; M5–M7 consume it. If a UI requirement needs a protocol change, the fix belongs in a backend milestone.

## Goals

- Add and remove project directories, and keep them across restarts.
- Start multiple chats per project, running concurrently.
- Prompt an agent and render its streaming updates live.
- Answer permission requests from the UI.
- Cancel a running prompt and cancel any open permission request with it.
- Keep agent processes from leaking on disconnect or shutdown.
- Launch each agent with the project directory as its `cwd`.
- Surface unsupported client methods and authentication failures clearly.
- Run the whole flow against a fake agent without network or tokens.
- Ship the backend as a usable product on its own: the WS protocol is drivable with `wscat` before any UI exists.

## Non-goals for v1

- Git worktree creation or cleanup.
- Persisting chats, chat history, or reconnecting to a live chat after refresh.
- An async database driver.
- Client filesystem capability (`fs/*`) or terminal capability (`terminal/*`).
- Reading, writing, or diffing project files on behalf of an agent.
- MCP server configuration.
- Agent authentication UI (`authenticate`, `logout`), credential storage, or API-key entry.
- Multi-user auth, tenancy, sandboxing, or remote deployment.
- Markdown rendering, file diff viewer, or terminal output view.
- Session modes and config option UI.
- Production static asset serving. A Vite dev server proxied to the backend is enough initially.

## Diagram

```
┌──────────────────────────────┐
│ Browser (React + Vite)       │
│ built in M5–M7               │
│                              │
│ Project sidebar              │
│ Chat list per project        │
│ Chat view + permission modal │
└──────────────┬───────────────┘
               │
               │ REST /api/projects, /api/agents
               │ WebSocket /ws (one socket per chat)
               │
┌──────────────▼───────────────┐
│ Backend (Fastify + zod)      │
│                              │
│ HTTP routes                  │
│ WS route                     │
│ Project store (SQLite)       │
│ Chat connection handler      │
│ Permission bridge            │
│ Agent process manager        │
└──────────────┬───────────────┘
               │
               │ stdio, NDJSON JSON-RPC (ACP v1)
               │
┌──────────────▼───────────────┐
│ Agent process (one per chat) │
│                              │
│ Any configured ACP agent     │
└──────────────────────────────┘
```

The backend is the only writer of `data/foe.db`; the browser never touches it.

## Trust boundaries

- Browser to backend: local unauthenticated HTTP/WS on loopback. Never expose publicly.
- Backend to agent: the agent is a separate process running as the same OS user. It is not sandboxed.
- Agent to filesystem: the agent owns file and terminal access. The backend never executes `fs/*` or `terminal/*` on its behalf.
- Agent to credentials: each CLI owns its login state. The backend does not read, store, or forward credentials in v1.
- Backend to database: `data/foe.db` is a local file written only by the backend. All values are bound parameters, never interpolated SQL.

## Repository layout

```
foe/
├── package.json                # turbo scripts
├── pnpm-workspace.yaml         # apps/*, packages/*, catalog
├── turbo.json
├── config/agents.example.json  # fake preset plus real agent presets
├── data/                       # gitignored; foe.db, foe.db-wal, foe.db-shm
├── database/migrations/        # committed; drizzle-kit output, applied at startup
├── docs/
│   ├── protocol.md             # M4
│   └── agent-presets.md        # M4
├── apps/
│   ├── server/
│   │   ├── fixtures/fake-agent.ts
│   │   ├── drizzle.config.ts
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config/          # env.ts + agent.ts
│   │       ├── protocol.ts      # M3; moves to packages/protocol in M5
│   │       ├── lib/
│   │       │   ├── fastify.ts
│   │       │   ├── db/          # schema.ts + index.ts
│   │       │   ├── projects.ts
│   │       │   ├── agent-process.ts
│   │       │   └── chat.ts
│   │       └── routes/
│   │           ├── index.ts
│   │           ├── api/         # health.ts, projects.ts, agents.ts
│   │           └── ws/chat.ts
│   └── web/                     # M5
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── eslint.config.js
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── api.ts
│           ├── chat-store.ts
│           ├── components/
│           └── styles.css
└── packages/
    ├── protocol/                # M5: @repo/protocol
    ├── eslint-config/
    └── typescript-config/
```

No router, state management library, UI kit, or Markdown renderer in v1.

## Decisions

| Area                | Decision                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ACP client location | Backend, not browser                                                                                                       |
| Agents              | Configurable command presets; multiple concurrent agents                                                                   |
| v1 features         | New chat, prompt, streaming updates, permissions, cancel                                                                   |
| Deployment          | Local single user, bind `127.0.0.1`                                                                                        |
| Repo                | This `foe` monorepo (pnpm workspaces + turbo)                                                                              |
| Stack               | Fastify + zod + `@fastify/websocket`/`ws`; React + Vite on the client                                                      |
| Milestone order     | Backend M0–M4, then UI M5–M7                                                                                               |
| Protocol types      | `packages/protocol` (`@repo/protocol`)                                                                                     |
| Protocol            | ACP v1 stable (`@agentclientprotocol/sdk` 2.1.0)                                                                           |
| ACP client surface  | `initialize`, `session/new`, `session/prompt`, `session/cancel`; handles `session/update` and `session/request_permission` |
| Filesystem          | Not implemented. Advertise `fs: { readTextFile: false, writeTextFile: false }`                                             |
| Terminal            | Not advertised; agents use their own terminals                                                                             |
| Authentication      | Agent CLIs are logged in before a chat starts. v1 does not call `authenticate`                                             |
| Worktrees           | Future                                                                                                                     |
| Chat persistence    | Future; v1 keeps chats in memory per connection                                                                            |
| Project persistence | SQLite via `better-sqlite3`; file `./data/foe.db`, override with `DATABASE_FILE`                                           |
| Database            | `better-sqlite3`, WAL, Drizzle schema with generated SQL migrations in `database/migrations/`                              |

## Assumptions

- One agent process per chat, each with its own ACP connection and session.
- Projects persist in SQLite; chats are ephemeral and bound to a live socket.
- A small fake ACP agent serves automated tests and token-free manual demos.
- Agent presets are edited in `config/agents.json`; no agent-management UI in v1.
- Agents own their tools; the backend only launches, transports, and renders.
- The CLI login is the auth boundary.
- The backend is useful without a browser; the UI consumes a frozen protocol.

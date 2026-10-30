# ACP Web GUI — Implementation Plan (v2)

Protocol: ACP v1 stable (`@agentclientprotocol/sdk` 2.1.0, named exports only)
Runtime: Node.js 24+, pnpm 12, Fastify 5 + zod 4, `@fastify/websocket`, React, Vite, TypeScript
Role: UI orchestrator, not an agent harness

Revision note (v2):

- The web UI moves to the end of v1. M0–M4 finish, harden, and document the
  backend and its WebSocket protocol; M4 freezes that protocol. M5–M7 build the
  UI against it.
- The plan is aligned with the `foe` monorepo it lives in: pnpm workspaces +
  turbo, `apps/server` and `apps/web`, Fastify + zod instead of `node:http` with
  manual routing, and no shared package until M5.
- Every SDK sketch is corrected for `@agentclientprotocol/sdk` 2.1.0.

Design note: this does not implement ACP filesystem or terminal methods. The
backend is a thin ACP client that launches existing agent harnesses (OpenCode,
Codex, and similar), streams their typed events to one web UI, and brokers
permission prompts. Agents keep their own file and terminal tooling.

---

## 1. Summary

Build a local, single-user web GUI that orchestrates multiple ACP coding agents.

The backend is a thin ACP **client**:

- Spawns one agent process per chat over stdio.
- Initializes the ACP connection and creates a session.
- Handles the only client-side request the UI needs: `session/request_permission`.
- Streams agent updates to the browser.
- Advertises no filesystem or terminal capabilities, so agents use their own tools.

The browser never speaks ACP. It uses a small custom WebSocket protocol for one chat at a time, plus a REST API for projects and agent presets.

This keeps the browser thin, keeps the backend out of the harness business, and avoids reimplementing what OpenCode, Codex, etc already do.

Delivery order matters more than feature order here: the backend and its wire
protocol are finished and documented before any React is written, so UI needs
cannot quietly reshape the protocol.

---

## 2. Confirmed decisions

| Area                | Decision                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ACP client location | Backend, not browser                                                                                                       |
| Agents              | Configurable command presets; multiple concurrent agents                                                                   |
| v1 features         | New chat, prompt, streaming updates, permissions, cancel                                                                   |
| Deployment          | Local single user, bind `127.0.0.1`                                                                                        |
| Repo                | This repo: `foe` monorepo (pnpm workspaces + turbo)                                                                        |
| Stack               | Fastify + zod + `@fastify/websocket`/`ws`; React + Vite on the client                                                      |
| Milestone order     | Backend M0–M4, then UI M5–M7                                                                                               |
| Protocol types      | `apps/server/src/protocol.ts` until M5, then `packages/protocol` (`@repo/protocol`)                                        |
| Protocol            | ACP v1 stable                                                                                                              |
| ACP client surface  | `initialize`, `session/new`, `session/prompt`, `session/cancel`; handles `session/update` and `session/request_permission` |
| Filesystem          | Not implemented. Client advertises `fs: { readTextFile: false, writeTextFile: false }`; agents use their own tools         |
| Terminal            | Not advertised; agents use their own terminals                                                                             |
| Authentication      | Agent CLIs are logged in before a chat starts. v1 does not call `authenticate`                                             |
| Worktrees           | Future                                                                                                                     |
| Chat persistence    | Future; v1 keeps chats in memory                                                                                           |
| Project persistence | Future; v1 keeps the project list in memory. Future projects and chats/sessions persist to a database                      |

### Assumptions

1. **One agent process per chat.** Each chat owns its own process, ACP connection, and ACP session. This isolates failures and matches “spawn multiple agents to run in different sessions.” A process-per-project model can replace it later without changing the browser protocol.
2. **Projects and chats are in-memory in v1.** Restarting the backend clears both. A future version persists projects and chats/sessions to a database.
3. **A small fake ACP agent is used instead of copying the SDK example.** It serves both automated tests and token-free manual demos.
4. **Agent presets are edited in `config/agents.json`.** No agent-management UI in v1.
5. **Agents own their tools.** OpenCode, Codex, etc run their own file operations and commands. The backend only launches them, transports ACP messages, and renders updates.
6. **The CLI login is the auth boundary.** `opencode auth login`, `codex login` happen outside this UI. If `session/new` fails, the UI shows the failure and the agent's advertised auth methods so the user knows what to run.
7. **The backend is useful without a browser.** At the end of M4 the REST and WebSocket APIs are complete and driveable with `curl` and `wscat`; the UI is a client of a frozen protocol, not a co-designer of it.

---

## 3. Goals and non-goals

### Goals

- Add and remove project directories for the running backend session.
- Start multiple chats per project, running concurrently.
- Prompt an agent and render its streaming updates live.
- Answer permission requests from the UI.
- Cancel a running prompt and cancel any open permission request with it.
- Keep agent processes from leaking on disconnect or shutdown.
- Launch each agent with the project directory as its `cwd`.
- Surface unsupported client methods and authentication failures clearly.
- Run the whole flow against a fake agent without network or tokens.
- Ship the backend as a usable product on its own: the WS protocol is drivable
  with `wscat` before any UI exists.

### Non-goals for v1

- Git worktree creation or cleanup.
- Persisting projects, chats, or history, or reconnecting to a live chat after refresh.
- Client filesystem capability (`fs/*`). Agents use their own file tools.
- Client terminal capability (`terminal/*`). Agents use their own terminals.
- Reading, writing, or diffing project files on behalf of an agent.
- MCP server configuration.
- Agent authentication UI (`authenticate`, `logout`), credential storage, or API-key entry.
- Multi-user auth, tenancy, sandboxing, or remote deployment.
- Markdown rendering, file diff viewer, or terminal output view. Agents report
  diffs and tool output as `session/update` content; the UI renders that subset.
- Session modes and config option UI.
- Production static asset serving. A Vite dev server (proxied to the backend)
  is enough initially; static serving is a decision left open in section 15.

---

## 4. Architecture

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
│ Project registry             │
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

`/api` and `/ws` are complete and testable at the end of M4. Everything above
the backend box in the diagram is M5–M7 work and consumes the protocol without
changing it.

### Trust boundaries

- Browser to backend: local unauthenticated HTTP/WS on loopback. Never expose publicly.
- Backend to agent: the agent is a separate process running as the same OS user. It is not sandboxed.
- Agent to filesystem: the agent owns file and terminal access. The backend never executes `fs/*` or `terminal/*` on its behalf.
- Agent to credentials: each CLI owns its login state. The backend does not read, store, or forward credentials in v1.

---

## 5. Repository layout

```
foe/
├── package.json                # turbo scripts (exists)
├── pnpm-workspace.yaml         # apps/*, packages/*, catalog (exists)
├── turbo.json                  # exists
├── config/agents.example.json  # exists; fake preset switched to tsx in M0
├── docs/
│   ├── protocol.md             # new (M4)
│   └── agent-presets.md        # new (M4)
├── apps/
│   ├── server/
│   │   ├── fixtures/
│   │   │   └── fake-agent.ts        # M2
│   │   ├── vitest.config.ts         # exists
│   │   └── src/
│   │       ├── index.ts             # exists → uses buildApp()
│   │       ├── config.ts            # exists stub → env + agents.json (M0)
│   │       ├── protocol.ts          # M3; moves to packages/protocol in M5
│   │       ├── lib/
│   │       │   ├── fastify.ts       # exists → app factory
│   │       │   ├── projects.ts      # M1
│   │       │   ├── agents.ts        # M1 preset loading and resolution
│   │       │   ├── agent-process.ts # M2
│   │       │   └── chat.ts          # M3
│   │       └── routes/
│   │           ├── index.ts         # exists
│   │           ├── api/
│   │           │   ├── health.ts    # exists
│   │           │   ├── projects.ts  # M1
│   │           │   └── agents.ts    # M1
│   │           └── ws/
│   │               └── chat.ts      # M3
│   └── web/                         # M5
│       ├── package.json             # @repo/web
│       ├── vite.config.ts           # proxy /api and /ws to the server
│       ├── tsconfig.json            # extends @repo/typescript-config/vite.json
│       ├── eslint.config.js         # @repo/eslint-config/react
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── api.ts
│           ├── chat-store.ts
│           ├── components/
│           │   ├── ProjectSidebar.tsx
│           │   ├── ChatList.tsx
│           │   ├── ChatView.tsx
│           │   ├── PromptInput.tsx
│           │   └── PermissionDialog.tsx
│           └── styles.css
└── packages/
    ├── protocol/                # M5: @repo/protocol
    ├── eslint-config/           # exists (has react.js already)
    └── typescript-config/       # exists (has vite.json and react-library.json)
```

No router, state management library, UI kit, or Markdown renderer in v1. zod is
already a server dependency and stays the validation layer for both HTTP bodies
and WebSocket client messages. `@repo/eslint-config/react` and
`@repo/typescript-config/vite.json` already exist, so M5 adds no new config
packages.

---

## 6. Wire protocol

### 6.1 REST API

All routes are Fastify route modules under `apps/server/src/routes/api/` and are
registered under the `/api` prefix. All responses are JSON. Errors use
`{ "error": string }` with an appropriate status code.

| Method   | Path                | Body                 | Response                                  |
| -------- | ------------------- | -------------------- | ----------------------------------------- |
| `GET`    | `/api/health`       | —                    | `{ "ok": true }` (already implemented)    |
| `GET`    | `/api/agents`       | —                    | `[{ "id", "name" }]`                      |
| `GET`    | `/api/projects`     | —                    | `[{ "id", "name", "path", "available" }]` |
| `POST`   | `/api/projects`     | `{ "name", "path" }` | `201` project                             |
| `DELETE` | `/api/projects/:id` | —                    | `204`                                     |

Validation is a zod schema per body, parsed with `safeParse` in the handler:

- `name` is non-empty after trimming.
- `path` is absolute, exists, and is a directory.
- Store the canonical path (`fs.realpath`) to avoid symlink ambiguity.
- Reject duplicates by canonical path with `409`.
- `GET /api/agents` returns only `id` and `name`. Never return `env` values; they may contain API keys.

Fastify's `bodyLimit` is set once in the app factory (1 MiB) rather than
per route.

### 6.2 WebSocket

Endpoint: `ws://127.0.0.1:8787/ws`, a `GET` route registered with
`@fastify/websocket`. The plugin's `maxPayload` and the SDK's
`ndJsonStream({ maxMessageBytes })` both use `acp.DEFAULT_MAX_MESSAGE_BYTES` so
the browser limit and the backend-to-agent limit cannot drift apart.

- One socket per chat.
- The first message must be `start` within 10 seconds; otherwise close with code `4000`.
- Client messages are parsed with a zod discriminated union on `type`. Invalid JSON or an unknown/invalid message type closes the socket with code `4001`.
- Heartbeat: server ping every 30 seconds; terminate a socket that misses a pong.

#### Client to server

```ts
type ClientMessage =
    | { type: "start"; projectId: string; agentId: string }
    | { type: "prompt"; text: string }
    | { type: "cancel" }
    | { type: "permission"; requestId: string; optionId: string | null };
```

`optionId: null` means cancel the permission request.

#### Server to client

```ts
type ServerMessage =
    | { type: "ready"; chatId: string; sessionId: string; agentId: string }
    | { type: "update"; update: acp.SessionUpdate }
    | {
          type: "permission_request";
          requestId: string;
          params: acp.RequestPermissionRequest;
      }
    | { type: "prompt_done"; stopReason: acp.StopReason }
    | {
          type: "error";
          message: string;
          detail?: string;
          authMethods?: AuthMethodSummary[];
      }
    | { type: "closed"; reason?: string };

type AuthMethodSummary = {
    id: string;
    name: string;
    description?: string | null;
};
```

`acp` types are imported type-only from `@agentclientprotocol/sdk`.

There is no `authenticate` message in v1. `authMethods` is only included so the
UI can tell the user which CLI login flow to run when `session/new` fails.

`update` is forwarded as-is. The backend does not translate, filter, or buffer
`SessionUpdate` payloads beyond checking `sessionId`.

### 6.3 Example exchange

```
client → { "type": "start", "projectId": "p1", "agentId": "fake" }
server → { "type": "ready", "chatId": "c1", "sessionId": "s1", "agentId": "fake" }

client → { "type": "prompt", "text": "Refactor the parser" }
server → { "type": "update", "update": { "sessionUpdate": "agent_message_chunk", ... } }
server → { "type": "permission_request", "requestId": "r1", "params": { ... } }
client → { "type": "permission", "requestId": "r1", "optionId": "<one of params.options>" }
server → { "type": "prompt_done", "stopReason": "end_turn" }

client → { "type": "prompt", "text": "Run the slow test" }
client → { "type": "cancel" }
server (internal) → resolves open permission requests as cancelled
server → { "type": "prompt_done", "stopReason": "cancelled" }

client closes socket
server (internal) → kills agent process group
```

Option IDs are chosen by the agent and differ per adapter. The UI must send one
of the `params.options[].optionId` values it received for that request.

---

## 7. Backend design

### 7.1 Bootstrap (`apps/server/src/index.ts`, `src/lib/fastify.ts`)

`buildApp()` in `lib/fastify.ts` is the single app factory, used by `index.ts`
and by every integration test:

```ts
export function buildApp() {
    return Fastify({ logger: true, bodyLimit: 1024 * 1024 });
}
```

`index.ts` then:

1. Loads config (`loadConfig`, `loadAgents`).
2. Registers `@fastify/websocket` with `maxPayload: acp.DEFAULT_MAX_MESSAGE_BYTES`.
3. Registers the REST plugin at prefix `/api`.
4. Registers `GET /ws` (module `routes/ws/chat.ts`).
5. Adds an `onClose` hook that closes all live chats and kills their processes.
6. Binds `127.0.0.1` by default; warns at startup when `HOST` is not loopback.
7. On `SIGINT` / `SIGTERM` calls `app.close()`, which triggers the `onClose`
   teardown, then exits.

`onClose` is the only shutdown path; do not duplicate teardown in the signal
handlers.

### 7.2 Config (`apps/server/src/config.ts`)

The current file is a stub with `DEFAULT_HOST` / `DEFAULT_PORT` and a TODO.
M0 replaces it with a zod-validated loader.

Environment:

| Variable      | Default                | Purpose                         |
| ------------- | ---------------------- | ------------------------------- |
| `PORT`        | `8787`                 | HTTP/WS port                    |
| `HOST`        | `127.0.0.1`            | Bind address                    |
| `AGENTS_FILE` | `./config/agents.json` | Agent presets, relative to root |

No persistence configuration exists in v1. A future database will add its own
connection settings.

`findRepoRoot()`: walk up from `process.cwd()` until a directory containing
`pnpm-workspace.yaml` is found; throw with a clear message if none is found.
Resolve `AGENTS_FILE` and every preset `command` or argument that starts with
`./` against that root. This is required because turbo runs tasks with the
package directory as `cwd`, so `./config/agents.json` would otherwise resolve to
`apps/server/config/`.

`agents.json`:

```json
{
    "agents": [
        {
            "id": "fake",
            "name": "Fake agent (no tokens)",
            "command": "./apps/server/node_modules/.bin/tsx",
            "args": ["./apps/server/fixtures/fake-agent.ts"],
            "env": {}
        },
        {
            "id": "opencode",
            "name": "OpenCode",
            "command": "opencode",
            "args": ["acp"],
            "env": {}
        },
        {
            "id": "codex",
            "name": "Codex",
            "command": "npx",
            "args": ["-y", "@agentclientprotocol/codex-acp"],
            "env": {}
        }
    ]
}
```

- Validate ids are unique and commands are non-empty.
- The child runs with `cwd` set to the project directory. Preset paths that
  start with `./` are resolved to absolute paths against the repo root at spawn
  time; bare commands use normal `PATH` lookup. Document this in the README.
- The fake preset points at the workspace-local `tsx` binary so it does not
  depend on Node's type stripping or on `tsx` being on `PATH`.
- The preset `env` is merged over `process.env` for the child only.
- Do not log `env` values.
- `npx -y` fetches the adapter on first run and may drift across versions. Pin
  versions in `docs/agent-presets.md` or install adapters globally for repeatable
  runs.
- These presets assume the user already ran `opencode auth login`, `codex login`. See `docs/agent-presets.md`.

### 7.3 Project registry (`apps/server/src/lib/projects.ts`)

```ts
interface Project {
    id: string;
    name: string;
    path: string; // canonical absolute path
}
```

- Keep projects in a `Map<string, Project>` in memory for v1.
- IDs are `crypto.randomUUID()`.
- On `GET`, check whether the directory still exists and report
  `available: false` if it does not. Do not drop the entry.
- Deleting a project removes the in-memory entry only. _It never deletes the
  directory_.
- No persistence writes and no store abstraction in v1.

Future persistence:

- Projects and chats/sessions will both be persisted to a database.
- Choose the database and schema later. Keep stable IDs and do not destructively
  clean up records whose paths or processes are missing.
- Adding database persistence later must not change the WebSocket protocol.

### 7.4 HTTP API (`apps/server/src/routes/api/*.ts`)

- One Fastify route module per resource, registered in `routes/index.ts`.
- Each `POST` body is parsed with a zod schema via `safeParse`; failures return
  `400` before the registry is touched.
- Status codes: `400` invalid body/path, `404` unknown project, `409` duplicate path, `500` unexpected.
- `DELETE` only removes the in-memory project entry. It never deletes the directory.
- `GET /api/agents` maps presets to `{ id, name }`; the mapping is the only
  place env can leak, so it is tested.

### 7.5 Agent process (`apps/server/src/lib/agent-process.ts`)

Responsibilities:

- Spawn the configured command with the project directory as `cwd`.
- Build the ACP NDJSON stream.
- Register client handlers.
- Initialize the connection.
- Create the session.
- Expose `prompt`, `cancel`, and `close`.

Sketch (corrected for SDK 2.1.0):

```ts
import * as acp from "@agentclientprotocol/sdk";

const child = spawn(preset.command, preset.args, {
    cwd,
    env: { ...process.env, ...preset.env },
    stdio: ["pipe", "pipe", "pipe"],
    detached: process.platform !== "win32",
});

const stream = acp.ndJsonStream(
    Writable.toWeb(child.stdin!),
    Readable.toWeb(child.stdout!) as ReadableStream<Uint8Array>,
);

let sessionId: string | undefined;

const app = acp
    .client({ name: "foe" })
    .onNotification(acp.methods.client.session.update, ({ params }) => {
        if (params.sessionId === sessionId) onUpdate(params.update);
    })
    .onRequest(
        acp.methods.client.session.requestPermission,
        ({ params, requestId }) => requestPermission(requestId, params),
    );

const connection = app.connect(stream);

const init = await connection.agent.request(acp.methods.agent.initialize, {
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {
        fs: { readTextFile: false, writeTextFile: false },
        terminal: false,
    },
});

const session = await connection.agent.request(acp.methods.agent.session.new, {
    cwd,
    mcpServers: [],
});
sessionId = session.sessionId;
```

Notes:

- The package has **named exports only**. `import acp from ...` does not exist.
  Use `import * as acp from "@agentclientprotocol/sdk"`.
- `acp.client(...)` handlers receive a single context object (method, params,
  signal, agent, requestId). Read `params` from it; do not expect a positional
  `params` argument.
- `app.connect(stream)` is synchronous and takes the `ndJsonStream` result.
- Explicitly advertise `fs` and `terminal` as `false`. This tells the agent to
  use its own file and command tools. A published Gemini CLI ACP walkthrough
  does the same, and Gemini falls back to its local disk tooling.
- Do not register `fs/*` or `terminal/*` handlers. The SDK answers unhandled
  requests with JSON-RPC `method-not-found`; log that error. See section 7.6.
- `sessionId` is assigned after `session/new`. Handlers close over a mutable
  variable and reject requests until it is set.
- Keep `init.authMethods` in memory. If `session/new` fails, include a summary
  of those methods in the `error` frame so the UI can say what to run. Do not
  call `authenticate`.
- Keep the last 8 KiB of stderr in a ring buffer. Attach it to `error.detail`
  and `closed.reason` frames.
- Surface `initialize` or `session/new` failures as `error` + close; do not
  leave a half-open chat.

Prompt:

```ts
await connection.agent.request(acp.methods.agent.session.prompt, {
    sessionId,
    prompt: [{ type: "text", text }],
});
```

`prompt` is an array of content blocks, not a string.

Cancel:

```ts
// ACP requires open permission requests to be answered with `cancelled`
// before the turn is torn down.
resolveAllPermissionsAsCancelled();
await connection.agent.notify(acp.methods.agent.session.cancel, { sessionId });
```

`session/cancel` is a notification on the agent side. Sending it as a request
does not type-check.

Permission responses:

```ts
// selected
return { outcome: { outcome: "selected", optionId } };
// cancelled
return { outcome: { outcome: "cancelled" } };
```

The outcome is a union of objects whose `outcome` field is itself an object. Do
not send `{ outcome: "selected", optionId }`.

Allowed concurrency: one in-flight prompt per chat. A second `prompt` message while running returns `error` with “prompt already running”.

Teardown:

1. Resolve outstanding permission requests with `{ outcome: { outcome: "cancelled" } }`.
2. `connection.close()`.
3. `SIGTERM` the process group; `SIGKILL` after 3 seconds.
    - POSIX: `process.kill(-child.pid, signal)`.
    - Windows: `child.kill()`, then `taskkill /pid <pid> /T /F` as fallback.
4. Remove the chat from the registry.

### 7.6 Unsupported client methods and auth failures

Unsupported methods:

- The backend registers neither `fs/*` nor `terminal/*` handlers.
- The SDK returns JSON-RPC `method-not-found` for unhandled requests.
- The backend logs the method name and the agent preset id. The browser only
  sees the resulting prompt error, not a crash or a silent hang.
- Do not add passthrough filesystem or terminal handlers in v1. That would move
  the backend back toward being a harness.

Authentication failures:

- `initialize` may return `authMethods`, even when the agent is already logged
  in. Do not treat their presence as “login required.”
- Attempt `session/new` normally.
- If it fails and `authMethods` is non-empty, send `error` with:
    - the agent's error message;
    - the stderr tail in `detail`;
    - `authMethods` as `{ id, name, description }` summaries.
- Do not call `authenticate`. The UI should tell the user which CLI login
  command to run. See `docs/agent-presets.md` for per-agent commands.
- A later version can add a generic `authenticate` step if browser-based login
  becomes a requirement.

### 7.7 Chat handler (`apps/server/src/lib/chat.ts`, `routes/ws/chat.ts`)

`routes/ws/chat.ts` is a thin `GET /ws` route: `@fastify/websocket` gives it
`(socket, req)`, and it hands the socket to `createChat(...)` from
`lib/chat.ts`. Everything below lives in `lib/chat.ts` and is testable without
Fastify route plumbing.

```ts
interface Chat {
    id: string;
    ws: WebSocket;
    agent?: AgentProcess;
    pendingPrompts: number;
    permissions: Map<string, (optionId: string | null) => void>;
}
```

Sequence:

1. Accept socket; start `start` timeout.
2. On `start`: resolve project + preset; spawn agent; initialize; create session; send `ready`.
3. On `prompt`: forward; send `prompt_done` or `error`.
4. On `permission`: resolve the matching pending request; ignore unknown IDs.
5. On `cancel`: resolve every open permission request as `cancelled`, then forward `session/cancel`.
6. On close/error: resolve pending permissions as cancelled; tear down agent; clear timers.
7. On agent process exit: send `closed` with the stderr tail; close the socket.
8. On `session/new` failure with advertised auth methods: send `error` with `authMethods`; close.
9. On app shutdown (`onClose`): tear down every chat the same way as step 6.

Guard against races: a WebSocket close while `initialize` is in flight must still kill the child.

---

## 8. Frontend design

Everything in this section is implemented in M5–M7. The wire protocol is frozen
at the end of M4; if a UI requirement needs a protocol change, that is a gap in
M4, and the fix belongs in the backend milestone, not in the React code.

Types come from `@repo/protocol` (extracted in M5). There is no
`apps/web/src/protocol.ts` and no duplicated message types.

### 8.1 State

```ts
type ChatStatus = "starting" | "idle" | "running" | "ended" | "error";

interface Chat {
    id: string;
    projectId: string;
    agentId: string;
    title: string;
    status: ChatStatus;
    items: ChatItem[];
    pendingPermission?: {
        requestId: string;
        params: acp.RequestPermissionRequest;
    };
    error?: { message: string; detail?: string };
    ws: WebSocket;
}
```

`App` holds:

- `projects: Project[]` from `GET /api/projects`.
- `agents: AgentSummary[]` from `GET /api/agents`.
- `chats: Map<string, Chat>` in a reducer.
- `selectedChatId`.

Chats are never persisted. A page refresh starts empty. Projects are re-fetched
from the backend on load; in v1 the backend holds them only in memory, so a
backend restart also clears the project list.

### 8.2 Chat items

Render the subset of `SessionUpdate` that matters:

| Update                                   | Rendering                                                        |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `agent_message_chunk`                    | Append text to the current assistant message                     |
| `agent_thought_chunk`                    | Collapsed “thinking” block                                       |
| `user_message_chunk`                     | Append to the user message (rarely sent by agents)               |
| `tool_call`                              | Tool card keyed by `toolCallId`                                  |
| `tool_call_update`                       | Merge into the existing tool card                                |
| `plan`                                   | Replace the current plan list                                    |
| `available_commands_update`              | Store for future slash-command autocomplete; do not render in v1 |
| `current_mode_update`                    | Ignore in v1                                                     |
| `config_option_update`                   | Store but do not render                                          |
| `session_info_update`                    | Update the chat title if a title is present                      |
| `usage_update`, `notice`, `compaction_*` | Minimal text line                                                |

Group text chunks by `messageId` when present; otherwise append to the last open message of the same role.

Never crash on an unknown `sessionUpdate`; ignore it.

Tool calls:

- Render `toolCall.content` entries. `type: "content"` is normal text or other
  content; `type: "diff"` shows the agent's own file change. The backend does
  not read files.
- Map `toolCall.kind` to an icon or color: `read`, `edit`, `delete`, `move`,
  `search`, `execute`, `think`, `fetch`, `switch_mode`, `other`.
- Map `toolCall.status`: `pending`, `in_progress`, `completed`, `failed`.
- `tool_call_update` carries only changed fields; merge by `toolCallId`.

Slash commands:

- Agents accept slash commands as plain text prompts, for example `/web agent
client protocol`. v1 can just send the typed text.
- `available_commands_update` can later drive autocomplete; no UI in v1.

### 8.3 Connection lifecycle

- `createChat(projectId, agentId)` creates the `Chat` in state with status `starting`, opens `/ws`, and sends `start` on open.
- The socket is kept open while switching chats, so background chats keep streaming.
- `ready` sets the session ID and status `idle`.
- `prompt_done` sets status `idle` and re-enables input.
- `cancel` sets an optimistic “cancelling” flag; the final `prompt_done` with `cancelled` restores `idle`.
- `error` shows a banner; `closed` marks the chat ended and disables input.
- Closing a chat closes the socket; backend teardown follows.

There is no automatic reconnect in v1. A refresh loses chats by design.

### 8.4 UI components

- `ProjectSidebar`: project list, add-project form (name + absolute path), remove button, unavailable badge.
- `ChatList`: chats for the selected project, new-chat button with agent picker, running indicator.
- `ChatView`: scrollable update list; auto-scroll unless the user scrolled up; error banner; status line.
- `PromptInput`: textarea, Enter to send (Shift+Enter newline), disabled while running; Stop button.
- `PermissionDialog`: tool title, options grouped by `kind` (`allow_once`, `allow_always`, `reject_once`, `reject_always`), plus a Cancel button that sends `optionId: null`. Render the option IDs and labels exactly as received; never hardcode IDs such as `proceed_once`, because they differ per adapter.

Plain text in `<pre>`-like blocks is enough for v1. Markdown rendering is a later enhancement.

---

## 9. Fake agent fixture

`apps/server/fixtures/fake-agent.ts` is a standalone ACP agent using
`acp.agent({ name })`. It registers its `initialize` handler first: the SDK
rejects every other request with `-32600` until initialize succeeds. Request
params are validated by the SDK before the handler runs, so the fixture only
handles well-formed input.

```ts
import * as acp from "@agentclientprotocol/sdk";

const stream = acp.ndJsonStream(
    Writable.toWeb(process.stdout),
    Readable.toWeb(process.stdin) as ReadableStream<Uint8Array>,
);

const app = acp
    .agent({ name: "fake" })
    .onRequest(acp.methods.agent.initialize, () => ({
        protocolVersion: acp.PROTOCOL_VERSION,
    }))
    .onRequest(acp.methods.agent.session.new, () => ({ sessionId: "fake-s1" }))
    .onRequest(acp.methods.agent.session.prompt, ({ params, client }) =>
        runPrompt(params, client),
    )
    .onNotification(acp.methods.agent.session.cancel, () => {
        cancelled = true;
    });

app.connect(stream);
```

Behavior keyed by prompt text so tests are deterministic:

| Prompt contains | Behavior                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `permission`    | Emits a `tool_call`, then `session/request_permission` with options whose IDs are deliberately non-obvious (`proceed_once`, `proceed_always`, `cancel`) |
| `slow`          | Streams a chunk every 250 ms for 10 seconds (for cancel and permission-cancel tests)                                                                    |
| `unsupported`   | Calls `fs/read_text_file` even though the client advertised it as unsupported, to verify the method-not-found path                                      |
| anything else   | Streams two text chunks, emits a `tool_call`, and returns `end_turn`                                                                                    |

Environment switches for integration tests:

- `FAKE_AGENT_REQUIRE_AUTH=1` makes `initialize` advertise an `authMethods`
  entry and makes `session/new` fail with an authentication error.
- `FAKE_AGENT_STDERR=1` writes a known line to stderr so the backend's stderr
  tail can be asserted.

It never makes network calls and never consumes model tokens.

Use it as the default preset in `config/agents.example.json` so manual testing works immediately.

---

## 10. Testing strategy

The backend is fully tested before any UI exists. Frontend work in M5–M7 is
verified by the manual checklist only; there are no browser tests in v1.

### Unit tests

`apps/server/src/lib/projects.test.ts`

- Add, list, delete.
- Relative, nonexistent, and non-directory paths are rejected.
- Duplicate canonical paths are rejected.
- A project whose directory disappears is reported as `available: false` but is
  not removed.
- Restarting the registry starts empty (v1 behavior).

`apps/server/src/lib/agents.test.ts` and `apps/server/src/config.test.ts`

- Agent ids are unique.
- `findRepoRoot()` resolves from `apps/server` and from the repo root.
- Relative `./` command and args resolve against the repository root while the
  child still runs with the project `cwd`.
- `env` is preserved for the child but never returned by `GET /api/agents`.

`apps/server/src/routes/api/projects.test.ts`

- Fastify `inject` against `buildApp()`: `400` for invalid body/path, `409` for
  duplicates, `404` for unknown ids, `201`/`204` on the happy path.

### Integration tests

`apps/server/src/lib/chat.test.ts` starts the real app on port `0` and spawns
the fake agent.

Scenarios:

1. `start` returns `ready` with a session ID.
2. Prompt streams `update` frames and ends with `prompt_done: end_turn`.
3. Two concurrent chats get distinct session IDs and do not cross-deliver updates.
4. Permission request round-trips: selecting an advertised option resolves with
   `selected`; the Cancel action resolves with `cancelled`.
5. Permission option IDs are forwarded unmapped; the test uses the fake agent's
   non-obvious IDs.
6. Cancel on a slow prompt resolves any open permission request as `cancelled`
   and returns `stopReason: cancelled`.
7. A `fs/*` call from a misbehaving fake agent surfaces as a method-not-found
   error; the backend does not perform filesystem work.
8. `FAKE_AGENT_REQUIRE_AUTH=1` yields an `error` frame carrying `authMethods`;
   no `authenticate` request is sent.
9. Closing the WebSocket kills the agent process within the timeout.
10. Invalid client messages close the socket with `4001`; a missing `start`
    closes with `4000`.
11. `app.close()` kills every live agent process.

Run with `vitest` (`pnpm --filter @repo/server test`). Use `ws` as the test
WebSocket client.

### Manual checks

Backend (available at the end of M4):

1. Configure the fake agent preset.
2. Add a project directory.
3. Open two chats in the same project with `wscat` and run prompts concurrently.
4. Exercise permission allow, reject, and cancel.
5. Cancel a slow prompt while a permission request is open.
6. Close a chat and verify no agent process remains (`ps`).
7. Repeat with OpenCode, Codex, etc presets after logging in with each CLI.

UI (M5–M7):

1. Add and remove a project from the sidebar.
2. Create a chat per agent preset and send a prompt.
3. Switch chats while a background chat streams.
4. Resolve a permission request from the dialog; cancel one.
5. Stop a running prompt and confirm the dialog dismisses.
6. Kill an agent process and confirm the chat shows an ended/error state.

### Documentation checks

- A fresh clone can run the fake agent end to end using only the README.
- Every command in `docs/agent-presets.md` is copy-pasteable and uses absolute
  paths where the backend requires them.
- The WS protocol example in `docs/protocol.md` matches `apps/server/src/protocol.ts`.

---

## 11. Milestones

M0–M4 have no browser dependency and touch only `apps/server` and `config/`.
M4 freezes the wire protocol. M5–M7 build the UI against a frozen protocol; they
must not require protocol changes. If one does, that is a bug in M4.

### M0 — Server scaffold and config

**Status: done.**

Deliverables:

- `lib/fastify.ts` `buildApp()` becomes the only app factory (`bodyLimit` 1 MiB, already the default);
  `index.ts` uses it instead of constructing Fastify inline.
- `config.ts`: `findRepoRoot()`, zod-validated `loadConfig()` (`HOST`, `PORT`,
  `AGENTS_FILE`) and `loadAgents()`.
- `config/agents.example.json`: fake preset switched to the workspace-local
  `tsx` binary with `./`-relative paths.
- Turbo/pnpm workspace files already exist; no changes expected.

Acceptance:

- `pnpm install`
- `cp config/agents.example.json config/agents.json` (gitignored; local presets)
- `pnpm typecheck` and `pnpm lint`
- `pnpm --filter @repo/server dev`, then
  `curl http://127.0.0.1:8787/api/health` returns `{ "ok": true }`.
- A missing `AGENTS_FILE` fails startup with a message naming the path.
- The stub TODO in `config.ts` is gone.

### M1 — Projects and agent presets

Deliverables:

- `lib/projects.ts` (in-memory registry, canonical paths).
- `lib/agents.ts` (preset loading, `./` path resolution, env stripping).
- `routes/api/projects.ts`, `routes/api/agents.ts`, registered in `routes/index.ts`.
- zod body schemas.
- Unit and `inject` tests.

Acceptance:

- Add/list/delete projects via `curl`.
- Restart the backend; the project list starts empty. v1 is in-memory by design.
- Invalid paths and duplicates return `400`/`409`.
- Env values never appear in `GET /api/agents`.
- `pnpm --filter @repo/server test` passes.

### M2 — Agent process and ACP client

Deliverables:

- `lib/agent-process.ts` with spawn, ACP wiring, initialize, session creation,
  prompt, cancel, teardown, stderr ring buffer.
- Explicit `fs: { readTextFile: false, writeTextFile: false }` and
  `terminal: false` capabilities.
- `fixtures/fake-agent.ts`.
- A script-level test that prompts the fake agent.

Acceptance:

- The backend can spawn the fake agent, initialize, create a session, and receive a prompt response.
- No `fs/*` or `terminal/*` handler is registered.
- An auth-required fake run produces an error frame with auth method summaries.
- Killing the backend leaves no child processes.

### M3 — WebSocket chat protocol

Deliverables:

- `src/protocol.ts`: client message zod union, server message types.
- `lib/chat.ts` with the message protocol, permission bridge, cancel, teardown.
- `routes/ws/chat.ts` registering `GET /ws` with `@fastify/websocket`.
- Integration tests.

Acceptance:

- All integration scenarios in section 10 pass.
- A `wscat` session can drive a full prompt and a permission request.
- Cancel resolves an open permission request before ending the turn.
- Two chats run concurrently.
- Invalid messages close the socket with the documented codes.

### M4 — Hardening, documentation, protocol freeze

Deliverables:

- Fastify `onClose` teardown of every live chat.
- Heartbeat ping every 30 seconds and stale-socket cleanup.
- Payload limits from `acp.DEFAULT_MAX_MESSAGE_BYTES` on both WS and NDJSON.
- Process-group kill verification (POSIX and Windows fallback).
- Startup/shutdown logging that names the bind address and the agents file.
- `README.md` with setup, run, security, presets, and troubleshooting.
- `docs/protocol.md` with the WS message types, lifecycle, and error frames,
  marked **frozen for v1** with the pinned SDK version recorded.
- `docs/agent-presets.md` with tested commands and login steps for OpenCode,
  Codex, the fake agent, and notes for Gemini CLI.
- A short “Resources” section in the README (section 17).

Acceptance:

- Start two chats, kill the backend with `Ctrl+C`, verify no orphan agents.
- Disconnect a socket and verify cleanup after the heartbeat timeout.
- A fresh clone can run the fake agent end to end using only the README.
- The documentation checks in section 10 pass.
- `docs/protocol.md` states the protocol is frozen and names the SDK version.

### M5 — Shared protocol package and frontend shell

Deliverables:

- Add `react`, `react-dom`, `@types/react`, `@types/react-dom`,
  `@vitejs/plugin-react` to the `pnpm-workspace.yaml` catalog.
- `packages/protocol` (`@repo/protocol`): move `src/protocol.ts` here, build to
  `dist` with declarations so turbo `^build` orders it before consumers.
- Server imports protocol types from `@repo/protocol`.
- `apps/web`: Vite + React + TS, `tsconfig.json` extending
  `@repo/typescript-config/vite.json`, `eslint.config.js` using
  `@repo/eslint-config/react`, dev proxy for `/api` and `/ws`.
- `api.ts`, `App.tsx`, `ProjectSidebar`, `ChatList`, new-chat flow with agent picker.

Acceptance:

- `pnpm install`, then `pnpm build` builds protocol before server and web.
- `pnpm typecheck` and `pnpm lint` pass across the workspace.
- `pnpm --filter @repo/web dev` loads in the browser.
- Projects can be added and removed from the UI.
- Creating a chat opens a socket and reaches `ready`.

### M6 — Streaming chat UI

Deliverables:

- `chat-store.ts` with the reducer and socket lifecycle.
- `ChatView`, `PromptInput`, update rendering per section 8.2.

Acceptance:

- Prompts stream live into the correct chat.
- Switching chats does not stop background streams.
- Multiple chats stream independently.
- Tool calls and plans render without breaking; unknown updates are ignored.

### M7 — Permissions, cancel, errors

Deliverables:

- `PermissionDialog`.
- Stop button that also cancels open permission requests.
- Error banner with optional stderr detail and agent auth method names.
- Ended/error states.

Acceptance:

- Allow, reject, and cancel permission outcomes reach the agent using the
  agent's own option IDs.
- Stop returns the prompt to idle and dismisses any open permission dialog.
- An auth failure shows the agent's error plus what CLI login to run.
- Agent exit shows an ended/error state and disables input.
- The manual UI checklist in section 10 passes.

---

## 12. Dependencies

Already in the workspace (`pnpm-workspace.yaml` catalog or package manifests):

- Root dev: `typescript`, `prettier`, `turbo`, `eslint` and its plugins.
- Server: `fastify`, `zod`, `@agentclientprotocol/sdk` (2.1.0), `ws`,
  `@fastify/websocket`, `tsx`, `vitest`, `@types/node`, `@types/ws`.
- Shared config packages: `@repo/eslint-config`, `@repo/typescript-config`.

Added in M5:

- Catalog: `react`, `react-dom`, `@types/react`, `@types/react-dom`,
  `@vitejs/plugin-react`. (`vite` is already in the catalog.)

Deliberately not added:

- HTTP framework other than Fastify
- Router
- State management library
- UI kit
- Markdown renderer

---

## 13. Security and operational notes

| Concern                                     | Handling                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Remote exposure                             | Bind `127.0.0.1`; warn if `HOST` is not loopback                                                          |
| Agent trust                                 | Agents run as the user; the app is not a sandbox                                                          |
| File and terminal access                    | Owned by the agent. The backend advertises no `fs`/`terminal` capability and runs none of those methods   |
| Auth credentials                            | Owned by each CLI. The backend never reads, stores, forwards, or logs credentials                         |
| Unsupported methods                         | Let the SDK answer `method-not-found`; log the method and preset id                                       |
| Secret leakage                              | `GET /api/agents` strips `env`; never log preset env                                                      |
| Large payloads                              | `acp.DEFAULT_MAX_MESSAGE_BYTES` applied to the WS `maxPayload` and the NDJSON stream; 1 MiB JSON body cap |
| Orphan processes                            | Fastify `onClose` teardown, process-group kill, heartbeat                                                 |
| Duplicate prompts                           | One in-flight prompt per chat                                                                             |
| Pending permissions on cancel or disconnect | Resolve as `cancelled` before teardown                                                                    |
| Project deletion                            | Remove the in-memory entry only; never touch the directory                                                |
| Refresh / restart                           | Chats are lost; projects survive a page refresh but not a backend restart in v1                           |

---

## 14. Risks and mitigations

| Risk                                            | Impact                          | Mitigation                                                                                                                |
| ----------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Agent requires client fs or terminal            | Prompt fails or degrades        | Most harness agents fall back to their own tools. Verify each intended agent early; add capabilities in v2 only if needed |
| Adapter calls an unadvertised method anyway     | Prompt error                    | The SDK returns `method-not-found`; the backend logs it and surfaces the error                                            |
| Agent requires ACP `authenticate`               | `session/new` fails             | v1 assumes CLI login. Surface the agent's error and auth method names; add generic auth later                             |
| Gemini CLI needs an API-key `authenticate` call | Cannot start without extra work | Use CLI login, or treat Gemini as a v1.1 auth task                                                                        |
| Adapter differences                             | Config/env quirks per agent     | Presets are user-editable; `docs/agent-presets.md` records tested commands                                                |
| Windows process cleanup                         | Orphan agents                   | Use `taskkill /pid <pid> /T /F` as the Windows fallback                                                                   |
| Long-running prompts                            | Memory growth in the browser    | Cap rendered items per chat (e.g., 2,000) or virtualize later                                                             |
| WebSocket backpressure                          | Slow UI, memory growth          | Watch `bufferedAmount`; close misbehaving sockets in a later iteration                                                    |
| UI work starts late                             | Protocol gaps found in M5       | M4 freezes the protocol and ships a `wscat` walkthrough; M5 consumes types from `@repo/protocol`                          |
| No reconnect                                    | Work lost on refresh            | Accepted v1; add session persistence and `session/load` later                                                             |
| In-memory projects and chats                    | Lost on backend restart         | Accepted v1; persist both to a database in a later version                                                                |
| SDK changes                                     | Breakage on upgrade             | Pin the SDK version in the catalog; rerun integration tests on upgrade                                                    |

---

## 15. Open questions

1. Should OpenCode, Codex, etc ship as presets, or only the fake agent plus a
   documented template? (`config/agents.example.json` currently ships all three.)
2. Should each project remember a default agent?
3. Does v1 need a way to open the project directory or validate it from the UI beyond adding it?
4. Is a Vite-dev-server-only setup acceptable for v1, given static asset serving
   is now the last hardening item and no longer blocks anything else?
5. Should the backend expose a “force kill” action for a stuck chat, or is socket close enough?
6. What is the expected behavior when the project directory is deleted while the backend runs?
7. Is a generic `authenticate` step worth adding in v1.1, or should all auth
   remain in the CLIs?

---

## 16. Appendix: ACP surface used

### Agent-side methods the backend calls or notifies

- `initialize` (request)
- `session/new` (request)
- `session/prompt` (request)
- `session/cancel` (notification)

### Client-side handlers the backend implements

- `session/update` (notification)
- `session/request_permission` (request)

That is the complete client role for v1.

### Agent responsibilities

- File reads, writes, and diffs, through its own tools.
- Terminal and command execution, through its own process.
- Authentication, through its own CLI login state.

### Not implemented in v1

- `authenticate`, `logout`
- `fs/read_text_file`, `fs/write_text_file`
- `terminal/create`, `terminal/output`, `terminal/release`, `terminal/wait_for_exit`, `terminal/kill`
- `session/load`, `session/list`, `session/delete`, `session/resume`, `session/close`
- `session/set_mode`, `session/set_config_option`
- `elicitation/*`
- MCP server configuration

### Client capabilities advertised

```ts
{
  fs: {
    readTextFile: false,
    writeTextFile: false,
  },
  terminal: false,
}
```

Explicit `false` matches the published Gemini CLI ACP walkthrough and tells the
agent to use its own file and terminal tooling. Registering no `fs/*` or
`terminal/*` handlers leaves the SDK's `method-not-found` response in place if an
adapter calls them anyway.

### Stop reasons

`end_turn`, `max_tokens`, `max_turn_requests`, `refusal`, `cancelled`.

The UI treats every stop reason as “turn finished”; it only special-cases `cancelled` for the Stop button flow.

### SDK API notes (`@agentclientprotocol/sdk` 2.1.0)

The installed package ships protocol v1 on its stable entrypoint. These details
differ from the v1 draft of this plan and from what older examples show:

- **Named exports only, ESM only.** `import acp from "@agentclientprotocol/sdk"`
  does not exist; use `import * as acp from "@agentclientprotocol/sdk"`.
- **Handlers take one context object**, not `params`:
  `({ method, params, signal, agent, requestId }) => result`. Return the result
  directly; the SDK does not want an `{ outcome }` wrapper around request
  results.
- **`session/request_permission` response** is
  `{ outcome: { outcome: "selected", optionId } }` or
  `{ outcome: { outcome: "cancelled" } }`.
- **`session/prompt`** takes `prompt: ContentBlock[]`, so pass
  `[{ type: "text", text }]`.
- **`session/new`** requires both `cwd` and `mcpServers`.
- **`initialize`** requires `protocolVersion: acp.PROTOCOL_VERSION` (literal `1`).
- **`session/cancel`** is a notification, not a request.
- **`client(...).connect(stream)`** is synchronous and takes the
  `ndJsonStream(...)` result. `ndJsonStream(output, input, { maxMessageBytes })`
  is output-first.
- **Fake agents:** `acp.agent({...})` rejects every request except `initialize`
  with `-32600` until an initialize handler succeeds, and the SDK zod-validates
  params before the handler runs.
- **No example files ship in the package.** The client/ws/http examples exist
  only in the GitHub repository linked below.

---

## 17. Documentation and resources

### Documentation deliverables

`README.md`

- What this is: a local UI orchestrator, not an agent harness.
- Requirements: Node.js 24+, pnpm 12, one or more agent CLIs installed.
- Workspace commands: `pnpm install`, `pnpm --filter @repo/server dev`,
  `pnpm --filter @repo/web dev`, `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- Quick start with the fake agent.
- How to add a project and a chat.
- Persistence: v1 keeps projects and chats in memory; restarting the backend
  clears them. Database persistence for both is planned.
- How to configure `config/agents.json`, including `AGENTS_FILE` and the
  repo-root rule for `./`-relative commands and arguments.
- Login steps for real agents.
- Security notes: loopback only, agents run as the user, no sandbox, CLI owns
  credentials.
- Troubleshooting: unsupported `fs`/`terminal` calls, auth failures, agent exit
  with stderr, orphan process checks.
- Links to the resources below.

`docs/protocol.md`

- The four client messages and the server messages, copied from
  `apps/server/src/protocol.ts` (then `@repo/protocol` after M5).
- One-chat-per-socket rule.
- `start` timeout, close codes, payload limit, heartbeat.
- Permission request/response correlation and the `optionId: null` cancel path.
- Cancel semantics: open permissions become `cancelled` before `session/cancel`.
- Error frame shape, including `authMethods`.
- The fact that the browser never speaks ACP.
- A frozen-protocol statement naming `@agentclientprotocol/sdk` 2.1.0.

`docs/agent-presets.md`

- Fake agent preset for token-free testing.
- OpenCode: `opencode acp`, login with `opencode auth login`.
- Codex: `npx -y @agentclientprotocol/codex-acp`, login with `codex login`;
  note the `preview` tag if used.
- Gemini CLI: `gemini --acp` (older `--experimental-acp`), with a warning that
  its API-key flow may require an ACP `authenticate` call that v1 does not send.
- Per-agent notes: `cwd`, env vars, auth method ids seen during testing, and
  known capability gaps.
- Version pinning guidance for `npx` presets.

### Agent preset reference

| Agent      | Command                                  | Notes                                               |
| ---------- | ---------------------------------------- | --------------------------------------------------- |
| Fake       | `tsx apps/server/fixtures/fake-agent.ts` | No tokens, no network                               |
| OpenCode   | `opencode acp`                           | Run `opencode auth login` first                     |
| Codex      | `npx -y @agentclientprotocol/codex-acp`  | Run `codex login` first; `@preview` exists          |
| Gemini CLI | `gemini --acp`                           | Older flag: `--experimental-acp`; may need ACP auth |

Verify the exact package names and flags against the linked docs before writing
them into the README; adapters change.

### Resources

Protocol:

- ACP v1 overview: https://agentclientprotocol.com/protocol/v1/overview
- Protocol overview (latest): https://agentclientprotocol.com/protocol/overview
- Transports (stdio, newline-delimited JSON-RPC): https://agentclientprotocol.com/protocol/transports
- Initialization and capabilities: https://agentclientprotocol.com/protocol/initialization
- Session setup: https://agentclientprotocol.com/protocol/session-setup
- Prompt turn: https://agentclientprotocol.com/protocol/prompt-turn
- Tool calls: https://agentclientprotocol.com/protocol/tool-calls
- Slash commands: https://agentclientprotocol.com/protocol/slash-commands
- ACP registry: https://agentclientprotocol.com/get-started/registry
- JSON-RPC 2.0 specification: https://www.jsonrpc.org/specification

TypeScript SDK:

- Repository: https://github.com/agentclientprotocol/typescript-sdk
- API reference: https://agentclientprotocol.github.io/typescript-sdk
- Client example (stdio): https://github.com/agentclientprotocol/typescript-sdk/blob/main/src/examples/client.ts
- WebSocket client example: https://github.com/agentclientprotocol/typescript-sdk/blob/main/src/examples/ws-client.ts
- HTTP/WebSocket server example: https://github.com/agentclientprotocol/typescript-sdk/blob/main/src/examples/http-server.ts

Agents:

- OpenCode ACP: https://opencode.ai/docs/acp
- Codex ACP adapter: https://github.com/agentclientprotocol/codex-acp
- Gemini CLI: https://github.com/google-gemini/gemini-cli
- Gemini CLI ACP mode: https://geminicli.com/docs/cli/acp-mode/

Background:

- “Agent Client Protocol by Hand” (Gemini over stdio, permission flow, capability
  fallback): https://dev.to/gabrielanhaia/agent-client-protocol-by-hand-drive-gemini-acp-over-json-rpc-on-stdio-1jdj
- Hermes IDE terminal-first ADR (the opposite design; useful comparison):
  https://github.com/hermes-hq/hermes-ide/blob/main/docs/adr/003-terminal-first-vendor-neutral.md

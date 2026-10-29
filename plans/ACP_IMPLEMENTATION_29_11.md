# ACP Web GUI — Implementation Plan

Status: Revised draft
Protocol: ACP v1 stable (`@agentclientprotocol/sdk` default entrypoint)
Runtime: Node.js 22+, `ws`, React, Vite, TypeScript
Role: UI orchestrator, not an agent harness

Revision note: v1 no longer implements ACP filesystem or terminal methods. The
backend is a thin ACP client that launches existing agent harnesses (OpenCode,
Codex, and similar), streams their typed events to one web UI, and
brokers permission prompts. Agents keep their own file and terminal tooling.

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

---

## 2. Confirmed decisions

| Area                | Decision                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ACP client location | Backend, not browser                                                                                                       |
| Agents              | Configurable command presets; multiple concurrent agents                                                                   |
| v1 features         | New chat, prompt, streaming updates, permissions, cancel                                                                   |
| Deployment          | Local single user, bind `127.0.0.1`                                                                                        |
| Stack               | Node + `ws` + React/Vite                                                                                                   |
| Repo                | Separate repository                                                                                                        |
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
- Production static asset serving (Vite dev server is enough initially).

---

## 4. Architecture

```
┌──────────────────────────────┐
│ Browser (React + Vite)       │
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
│ Backend (node:http + ws)     │
│                              │
│ HTTP API                     │
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

### Trust boundaries

- Browser to backend: local unauthenticated HTTP/WS on loopback. Never expose publicly.
- Backend to agent: the agent is a separate process running as the same OS user. It is not sandboxed.
- Agent to filesystem: the agent owns file and terminal access. The backend never executes `fs/*` or `terminal/*` on its behalf.
- Agent to credentials: each CLI owns its login state. The backend does not read, store, or forward credentials in v1.

---

## 5. Repository layout

```
acp-web/
├── package.json                  # npm workspaces: shared, server, web
├── package-lock.json
├── tsconfig.base.json
├── .gitignore                    # node_modules, dist, config/agents.json
├── README.md                     # setup, run, security, presets, troubleshooting
├── docs/
│   ├── protocol.md               # WS protocol and chat lifecycle
│   └── agent-presets.md          # per-agent commands, login, env, limits
├── config/
│   └── agents.example.json
├── shared/
│   ├── package.json
│   └── src/
│       └── protocol.ts           # WS message types + parse helpers
├── server/
│   ├── package.json
│   ├── fixtures/
│   │   └── fake-agent.ts         # scripted ACP agent for tests and demos
│   └── src/
│       ├── index.ts              # bootstrap, routing, shutdown
│       ├── config.ts             # agents.json, data dir, port
│       ├── projects.ts           # in-memory project registry
│       ├── http.ts               # REST API
│       ├── chat.ts               # WebSocket -> ChatSession
│       ├── agent-process.ts      # spawn, ACP wiring, process kill
│       ├── config.test.ts
│       ├── projects.test.ts
│       └── chat.test.ts
└── web/
    ├── package.json
    ├── vite.config.ts            # proxy /api and /ws to the server
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts
        ├── chat-store.ts
        ├── components/
        │   ├── ProjectSidebar.tsx
        │   ├── ChatList.tsx
        │   ├── ChatView.tsx
        │   ├── PromptInput.tsx
        │   └── PermissionDialog.tsx
        └── styles.css
```

No state library, router, UI kit, or schema validator in v1. The protocol has four client messages and a few server messages; manual parsing is enough.

---

## 6. Wire protocol

### 6.1 REST API

All responses are JSON. Errors use `{ "error": string }` with an appropriate status code.

| Method   | Path                | Body                 | Response                                  |
| -------- | ------------------- | -------------------- | ----------------------------------------- |
| `GET`    | `/api/health`       | —                    | `{ "ok": true }`                          |
| `GET`    | `/api/agents`       | —                    | `[{ "id", "name" }]`                      |
| `GET`    | `/api/projects`     | —                    | `[{ "id", "name", "path", "available" }]` |
| `POST`   | `/api/projects`     | `{ "name", "path" }` | `201` project                             |
| `DELETE` | `/api/projects/:id` | —                    | `204`                                     |

Validation rules:

- `name` is non-empty after trimming.
- `path` is absolute, exists, and is a directory.
- Store the canonical path (`fs.realpath`) to avoid symlink ambiguity.
- Reject duplicates by canonical path with `409`.
- `GET /api/agents` returns only `id` and `name`. Never return `env` values; they may contain API keys.

### 6.2 WebSocket

Endpoint: `ws://127.0.0.1:8787/ws`

- One socket per chat.
- The first message must be `start` within 10 seconds; otherwise close with code `4000`.
- Invalid JSON or an unknown message type closes the socket with code `4001`.
- Maximum payload: 16 MiB, matching the SDK transport example.
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

### 7.1 Bootstrap (`server/src/index.ts`)

- Load config.
- Create `node:http` server.
- Route `/api/*` to the HTTP handler.
- Handle `upgrade` for `/ws`; reject other paths.
- Serve nothing else in v1 (Vite proxies in development).
- Bind `127.0.0.1` by default; allow `HOST` override with a startup warning when not loopback.
- Track all live chats and agent processes.
- On `SIGINT` / `SIGTERM`: close WebSockets, kill processes, then exit.

### 7.2 Config (`server/src/config.ts`)

Environment:

| Variable         | Default                | Purpose       |
| ---------------- | ---------------------- | ------------- |
| `PORT`           | `8787`                 | HTTP/WS port  |
| `HOST`           | `127.0.0.1`            | Bind address  |
| `ACP_WEB_CONFIG` | `./config/agents.json` | Agent presets |

No persistence configuration exists in v1. A future database will add its own
connection settings.

`agents.json`:

```json
{
    "agents": [
        {
            "id": "fake",
            "name": "Fake agent (no tokens)",
            "command": "./node_modules/.bin/tsx",
            "args": ["./server/fixtures/fake-agent.ts"],
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
- The child runs with `cwd` set to the project directory. Because of that, `command` and any `args` starting with `./` resolve against the acp-web repository root, not the child `cwd`. Resolve them to absolute paths at spawn time. Document this in the README so real agent presets can rely on normal `PATH` lookup for bare commands.
- The preset `env` is merged over `process.env` for the child only.
- Do not log `env` values.
- `npx -y` fetches the adapter on first run and may drift across versions. Pin
  versions in `docs/agent-presets.md` or install adapters globally for repeatable
  runs.
- These presets assume the user already ran `opencode auth login`, `codex login`. See `docs/agent-presets.md`.

### 7.3 Project registry (`server/src/projects.ts`)

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

### 7.4 HTTP API (`server/src/http.ts`)

- Manual routing on `req.method` and `new URL(req.url, base).pathname`.
- Body limit: 1 MiB. Parse JSON in a try/catch and return `400` on failure.
- Status codes: `400` invalid body/path, `404` unknown project, `409` duplicate path, `500` unexpected.
- `DELETE` only removes the in-memory project entry. It never deletes the directory.

### 7.5 Agent process (`server/src/agent-process.ts`)

Responsibilities:

- Spawn the configured command with the project directory as `cwd`.
- Build the ACP NDJSON stream.
- Register client handlers.
- Initialize the connection.
- Create the session.
- Expose `prompt`, `cancel`, and `close`.

Sketch:

```ts
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
    .client({ name: "acp-web" })
    .onNotification(acp.methods.client.session.update, ({ params }) => {
        if (params.sessionId === sessionId) onUpdate(params.update);
    })
    .onRequest(acp.methods.client.session.requestPermission, ({ params }) =>
        requestPermission(params),
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

Cancel:

```ts
// ACP requires open permission requests to be answered with `cancelled`
// before the turn is torn down.
resolveAllPermissionsAsCancelled();
await connection.agent.notify(acp.methods.agent.session.cancel, { sessionId });
```

Allowed concurrency: one in-flight prompt per chat. A second `prompt` message while running returns `error` with “prompt already running”.

Teardown:

1. Resolve outstanding permission requests with `{ outcome: { outcome: "cancelled" } }`.
2. `connection.close()`.
3. `SIGTERM` the process group; `SIGKILL` after 3 seconds.
    - POSIX: `process.kill(-child.pid, signal)`.
    - Windows: `child.kill()`.
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

### 7.7 Chat handler (`server/src/chat.ts`)

Owns the WebSocket lifecycle:

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

Guard against races: a WebSocket close while `initialize` is in flight must still kill the child.

---

## 8. Frontend design

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
- Closing a chat sends `stop` by closing the socket; backend teardown follows.

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

`server/fixtures/fake-agent.ts` is a standalone ACP agent using `acp.agent(...)` and:

```ts
const stream = acp.ndJsonStream(
    Writable.toWeb(process.stdout),
    Readable.toWeb(process.stdin) as ReadableStream<Uint8Array>,
);
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

Use it as the default preset in `agents.example.json` so manual testing works immediately.

---

## 10. Testing strategy

### Unit tests

`projects.test.ts`

- Add, list, delete.
- Relative, nonexistent, and non-directory paths are rejected.
- Duplicate canonical paths are rejected.
- A project whose directory disappears is reported as `available: false` but is
  not removed.
- Restarting the registry starts empty (v1 behavior).

`config.test.ts`

- Agent ids are unique.
- Relative `./` command and args resolve against the repository root while the
  child still runs with the project `cwd`.
- `env` is preserved for the child but never returned by `GET /api/agents`.

### Integration tests

`chat.test.ts` starts the real server on port `0` and spawns the fake agent.

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
10. Invalid client messages close the socket.

Run with `vitest`. Use `ws` as the test WebSocket client.

### Manual checks

1. Configure the fake agent preset.
2. Add a project directory.
3. Open two chats in the same project and run prompts concurrently.
4. Exercise permission allow, reject, and cancel.
5. Cancel a slow prompt while a permission dialog is open.
6. Close a chat and verify no agent process remains (`ps`).
7. Repeat with OpenCode, Codex, etc presets after logging in with each CLI.

No automated tests against real agents; adapters differ and may require credentials.

### Documentation checks

- A fresh clone can run the fake agent end to end using only the README.
- Every command in `docs/agent-presets.md` is copy-pasteable and uses absolute
  paths where the backend requires them.
- The WS protocol example in `docs/protocol.md` matches the `shared` types.

---

## 11. Milestones

### M0 — Scaffold

Deliverables:

- Workspace `package.json`, TypeScript configs, `.gitignore`.
- `shared/src/protocol.ts`.
- `server/src/index.ts` answering `GET /api/health`.
- `web` Vite app rendering an empty shell.
- `config/agents.example.json`.

Acceptance:

- `npm install`
- `npm run typecheck`
- `curl http://127.0.0.1:8787/api/health` returns `{ "ok": true }`.
- `npm run dev -w web` loads in the browser.

### M1 — Projects and agent presets

Deliverables:

- `config.ts`, `projects.ts`, `http.ts`.
- REST API for projects and agents.
- Unit tests.

Acceptance:

- Add/list/delete projects via `curl`.
- Restart the backend; the project list starts empty. v1 is in-memory by design.
- Invalid paths and duplicates return `400`/`409`.
- Env values never appear in `GET /api/agents`.

### M2 — Agent process and ACP client

Deliverables:

- `agent-process.ts` with spawn, ACP wiring, initialize, session creation.
- Explicit `fs: { readTextFile: false, writeTextFile: false }` and `terminal: false` capabilities.
- `fake-agent.ts`.
- Unit tests for config; a minimal script-level test that prompts the fake agent.

Acceptance:

- The backend can spawn the fake agent, initialize, create a session, and receive a prompt response.
- No `fs/*` or `terminal/*` handler is registered.
- An auth-required fake run produces an error frame with auth method summaries.
- Killing the backend leaves no child processes.

### M3 — WebSocket chat protocol

Deliverables:

- `chat.ts` with the message protocol, permission bridge, cancel, teardown, heartbeat.
- Integration tests.

Acceptance:

- All integration scenarios in section 10 pass.
- A `wscat` session can drive a full prompt and a permission request.
- Cancel resolves an open permission request before ending the turn.
- Two chats run concurrently.

### M4 — Frontend shell

Deliverables:

- `api.ts`, `App.tsx`, project sidebar, add/remove project form.
- Chat list and new-chat flow with agent picker.

Acceptance:

- Projects can be managed from the UI.
- Creating a chat opens a socket and reaches `ready`.

### M5 — Streaming chat UI

Deliverables:

- `chat-store.ts` with the reducer and socket lifecycle.
- `ChatView`, `PromptInput`, update rendering.

Acceptance:

- Prompts stream live into the correct chat.
- Switching chats does not stop background streams.
- Multiple chats stream independently.
- Tool calls and plans render without breaking.

### M6 — Permissions, cancel, errors

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

### M7 — Hardening and documentation

Deliverables:

- Process-group kill verification on the target OS.
- Heartbeat and stale-socket cleanup.
- Startup/shutdown logging.
- Optional static serving of `web/dist`.
- `README.md` with setup, run, security, presets, and troubleshooting.
- `docs/protocol.md` with the WS message types, lifecycle, and error frames.
- `docs/agent-presets.md` with tested commands and login steps for OpenCode,
  Codex, the fake agent, and notes for Gemini CLI.
- A short “Resources” section in the README linking to the canonical ACP and
  SDK documentation (see section 17).

Acceptance:

- Start two chats, kill the backend with `Ctrl+C`, verify no orphan agents.
- Disconnect the network/socket and verify cleanup after the heartbeat timeout.
- A fresh clone can run the fake agent end to end using only the README.
- The documentation checks in section 10 pass.

---

## 12. Dependencies

Root dev:

- `typescript`, `tsx`, `vitest`, `@types/node`

Server:

- `@agentclientprotocol/sdk`
- `ws`
- `@types/ws` (dev)

Web:

- `react`, `react-dom`
- `vite`, `@vitejs/plugin-react`
- `@types/react`, `@types/react-dom` (dev)

Shared:

- `@agentclientprotocol/sdk` (type-only)

Deliberately not added:

- HTTP framework
- Router
- State management library
- UI kit
- Markdown renderer
- Validation library

---

## 13. Security and operational notes

| Concern                                     | Handling                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Remote exposure                             | Bind `127.0.0.1`; warn if `HOST` is not loopback                                                        |
| Agent trust                                 | Agents run as the user; the app is not a sandbox                                                        |
| File and terminal access                    | Owned by the agent. The backend advertises no `fs`/`terminal` capability and runs none of those methods |
| Auth credentials                            | Owned by each CLI. The backend never reads, stores, forwards, or logs credentials                       |
| Unsupported methods                         | Let the SDK answer `method-not-found`; log the method and preset id                                     |
| Secret leakage                              | `GET /api/agents` strips `env`; never log preset env                                                    |
| Large payloads                              | 16 MiB WS limit; 1 MiB JSON API body cap                                                                |
| Orphan processes                            | Process-group kill, heartbeat, shutdown handlers                                                        |
| Duplicate prompts                           | One in-flight prompt per chat                                                                           |
| Pending permissions on cancel or disconnect | Resolve as `cancelled` before teardown                                                                  |
| Project deletion                            | Remove the in-memory entry only; never touch the directory                                              |
| Refresh / restart                           | Chats are lost; projects survive a page refresh but not a backend restart in v1                         |

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
| No reconnect                                    | Work lost on refresh            | Accepted v1; add session persistence and `session/load` later                                                             |
| In-memory projects and chats                    | Lost on backend restart         | Accepted v1; persist both to a database in a later version                                                                |
| SDK changes                                     | Breakage on upgrade             | Pin the SDK version; rerun integration tests on upgrade                                                                   |

---

## 15. Open questions

1. Should OpenCode, Codex, etc all ship as presets, or only the fake
   agent plus a documented template?
2. Should each project remember a default agent?
3. Does v1 need a way to open the project directory or validate it from the UI beyond adding it?
4. Is Vite dev-server-only acceptable for v1, or is a single `npm start` serving built assets required?
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
- `session/request_permission`

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

---

## 17. Documentation and resources

### Documentation deliverables

`README.md`

- What this is: a local UI orchestrator, not an agent harness.
- Requirements: Node.js 22+, npm, one or more agent CLIs installed.
- Quick start with the fake agent.
- How to add a project and a chat.
- Persistence: v1 keeps projects and chats in memory; restarting the backend
  clears them. Database persistence for both is planned.
- How to configure `config/agents.json`.
- Login steps for real agents.
- Security notes: loopback only, agents run as the user, no sandbox, CLI owns
  credentials.
- Troubleshooting: unsupported `fs`/`terminal` calls, auth failures, agent exit
  with stderr, orphan process checks.
- Links to the resources below.

`docs/protocol.md`

- The four client messages and the server messages, copied from
  `shared/src/protocol.ts`.
- One-chat-per-socket rule.
- `start` timeout, close codes, payload limit, heartbeat.
- Permission request/response correlation and the `optionId: null` cancel path.
- Cancel semantics: open permissions become `cancelled` before `session/cancel`.
- Error frame shape, including `authMethods`.
- The fact that the browser never speaks ACP.

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

| Agent      | Command                                 | Notes                                               |
| ---------- | --------------------------------------- | --------------------------------------------------- |
| Fake       | `tsx server/fixtures/fake-agent.ts`     | No tokens, no network                               |
| OpenCode   | `opencode acp`                          | Run `opencode auth login` first                     |
| Codex      | `npx -y @agentclientprotocol/codex-acp` | Run `codex login` first; `@preview` exists          |
| Gemini CLI | `gemini --acp`                          | Older flag: `--experimental-acp`; may need ACP auth |

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

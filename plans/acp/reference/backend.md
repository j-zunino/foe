# Backend design

## Bootstrap

`buildApp()` in `apps/server/src/lib/fastify.ts` is the single app factory used by `index.ts` and every integration test. It receives the database handle:

```ts
export function buildApp({ db, sqlite }: DatabaseHandle) {
    const app = Fastify({ logger: true, bodyLimit: 1024 * 1024 });
    app.decorate("db", db);
    app.decorate("sqlite", sqlite);
    return app;
}
```

M1 adds the `projects` service (imported directly by routes); M2 adds `agents` presets. Augment Fastify instance types next to any decorators you add.

`buildApp()` registers `@fastify/websocket` (`maxPayload: acp.DEFAULT_MAX_MESSAGE_BYTES`) and the `routes` plugin, which mounts REST under `/api` and `GET /ws`. Integration tests therefore get the complete app from the factory.

`index.ts` then:

1. Loads config (`loadConfig`, `loadAgents`).
2. Opens the database with the resolved `DATABASE_FILE` and `<repo>/database/migrations`.
3. Builds the app.
4. Logs the bind address, agents file, and resolved database path.
5. Binds `127.0.0.1` by default; warns when `HOST` is not loopback.
6. On `SIGINT` / `SIGTERM` calls `app.close()`, then exits.

`onClose` is the only shutdown path: it tears down all live chats (killing their processes) and then closes the database. A database that cannot be opened fails startup with a message naming the resolved path.

## Config

`src/config/env.ts` is the zod-validated loader (`loadConfig`). `src/config/agent.ts` loads presets (`loadAgents`).

| Variable        | Default                | Purpose                           |
| --------------- | ---------------------- | --------------------------------- |
| `PORT`          | `8787`                 | HTTP/WS port                      |
| `HOST`          | `127.0.0.1`            | Bind address                      |
| `AGENTS_FILE`   | `./config/agents.json` | Agent presets, relative to root   |
| `DATABASE_FILE` | `./data/foe.db`        | SQLite database, relative to root |

- Resolve `AGENTS_FILE` and `DATABASE_FILE` against the repository root. Pass `:memory:` through untouched.
- Create the database parent directory with `mkdirSync(dirname(file), { recursive: true })`.
- `getRepoRoot()` walks up from `process.cwd()` until it finds `pnpm-workspace.yaml`; throw a clear error if none is found.
- Resolve preset `command` and `args` entries that start with `./` against the repo root. Bare commands use `PATH`.
- The child still runs with `cwd` set to the project directory.
- Preset `env` is merged over `process.env` for the child only. Never log env values.
- Validate ids are unique and commands are non-empty.

Example `config/agents.json`:

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
            "args": ["-y", "@agentclientprotocol/codex-acp@2.6.0"],
            "env": {}
        }
    ]
}
```

## Database

One connection, opened once at startup, owned by the Fastify instance. v1 has a single table. Drizzle owns the schema and migration files.

```ts
// schema.ts
const projects = sqliteTable("projects", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    path: text("path").notNull().unique(),
    createdAt: text("created_at")
        .notNull()
        .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

// index.ts
export function createDatabase({ filename, migrationsDir }) {
    const sqlite = new Database(filename);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("busy_timeout = 5000");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: migrationsDir });
    return { sqlite, db };
}
```

- Derive `Project` with `typeof projects.$inferSelect`; do not declare a parallel row interface.
- `drizzle.config.ts` resolves the repo root and uses absolute `out` and `dbCredentials.url`.
- `migrate()` applies committed migrations at startup and is a no-op when up to date. Never edit an applied migration; change `schema.ts` and run `pnpm --filter @repo/server db:generate`.
- Catch database open and parent-`mkdir` errors and rethrow `Cannot open database at <path>`. Leave migration errors unwrapped so the failing SQL is visible.
- `:memory:` skips `mkdir` and is passed through unresolved.
- `journal_mode = WAL` returns `memory` for `:memory:`; that is expected.
- `path` stores the canonical `fs.realpath`. The unique index produces `409`.
- SQLite is synchronous. Writes are single-row and sub-millisecond; no long transactions or bulk history writes in handlers.

## Project store

```ts
// services/projects.ts — plain object, every method takes the database handle
export const projects = { list, get, add, remove };
```

- Imported by route modules; no `fastify.projects` decorator and no closure. Each
  method takes `AppDatabase` as its first argument, so tests construct a database and
  call the service directly.
- Drizzle statements are built per call. Statements are cheap to construct and SQLite
  is synchronous; do not cache them.
- IDs are `crypto.randomUUID()`.
- `list`: `select().from(projects).orderBy(projects.createdAt, projects.id)`. No limit, no availability computation.
- `get`: returns the row, or `undefined` when the id is unknown.
- `add`: the route canonicalizes the path and defaults the name, then calls
  `insert(...).values(...).onConflictDoNothing().returning()`. A missing returned row
  means the `path` unique constraint fired, so throw `409 project already exists`.
- `remove`: `delete(...).where(eq(id)).returning()`; the route returns `204` when a row
  was removed and `404` otherwise.
- Deleting a project removes the row only. It never deletes the directory.
- No in-memory cache. SQLite is the source of truth.
- Do not store or compute an `available` flag. A directory can disappear at any moment,
  so a read-time snapshot is stale immediately. Validate the directory at the point of
  use instead: `resolveDirectory` on `POST /api/projects`, and the chat handler checks
  `project.path` before spawning an agent (M3).

Future persistence: chats and sessions move into the same database in separate tables, via a schema change plus a generated migration. Keep stable IDs and do not change the WebSocket protocol.

## HTTP API

- One Fastify route module per resource, registered in `routes/index.ts`.
- Each `POST` body is parsed with zod via `safeParse`; failures return `400`.
- Status codes: `400` invalid body/path, `404` unknown project, `409` duplicate path, `500` unexpected.
- `DELETE` deletes the row only.
- `GET /api/agents` reads `fastify.agents` and maps each preset to `{ id, name }`. Never serialize the decorated preset array directly.

## Agent process

`src/lib/agent-process.ts` spawns the configured command, builds the ACP stream, registers client handlers, initializes, creates a session, and exposes `prompt`, `cancel`, and `close`.

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

Rules:

- Import named exports only: `import * as acp from "@agentclientprotocol/sdk"`.
- Handlers receive one context object; read `params` from it.
- `app.connect(stream)` is synchronous.
- Advertise `fs` and `terminal` as `false`; register no `fs/*` or `terminal/*` handlers.
- Keep `init.authMethods` in memory. If `session/new` fails, include summaries in the `error` frame. Do not call `authenticate`.
- Keep the last 8 KiB of stderr in a ring buffer; attach it to `error.detail` and `closed.reason`.
- Surface `initialize` or `session/new` failures as `error` + close.

Prompt:

```ts
await connection.agent.request(acp.methods.agent.session.prompt, {
    sessionId,
    prompt: [{ type: "text", text }],
});
```

Cancel:

```ts
resolveAllPermissionsAsCancelled();
await connection.agent.notify(acp.methods.agent.session.cancel, { sessionId });
```

Permission responses:

```ts
return { outcome: { outcome: "selected", optionId } };
return { outcome: { outcome: "cancelled" } };
```

One in-flight prompt per chat. A second `prompt` while running returns an error: “prompt already running”.

Teardown:

1. Resolve outstanding permissions with `{ outcome: { outcome: "cancelled" } }`.
2. `connection.close()`.
3. `SIGTERM` the process group; `SIGKILL` after 3 seconds.
    - POSIX: `process.kill(-child.pid, signal)`.
    - Windows: `child.kill()`, then `taskkill /pid <pid> /T /F`.
4. Remove the chat from the chat map.

## Unsupported methods and auth failures

- The SDK returns JSON-RPC `method-not-found` for unhandled requests.
- Log the method name and agent preset id. The browser only sees the resulting prompt error.
- Do not add passthrough filesystem or terminal handlers in v1.

Auth:

- `initialize` may return `authMethods` even when logged in. Do not treat their presence as “login required.”
- Attempt `session/new` normally.
- If it fails and `authMethods` is non-empty, send `error` with the agent's message, the stderr tail in `detail`, and `{ id, name, description }` summaries.
- Do not call `authenticate`. The UI tells the user which CLI login command to run.

## Chat handler

`routes/ws/chat.ts` is a thin `GET /ws` route that hands the socket to `createChat(...)` in `lib/chat.ts`. Everything below lives in `lib/chat.ts`.

Chats are not persisted. A `projectId` that no longer exists fails `start` with an `error` frame.

Live chats live in one module-level map, `const chats = new Map<string, Chat>()`, keyed by `Chat.id`. `onClose` iterates it.

```ts
interface Chat {
    id: string;
    ws: WebSocket;
    agent?: AgentProcess;
    running: boolean;
    permissions: Map<string, (optionId: string | null) => void>;
}
```

Sequence:

1. Accept socket; start the `start` timeout.
2. On `start`: resolve project + preset; spawn agent; initialize; create session; register the chat; send `ready`.
3. On `prompt`: reject with `error` while `running`; otherwise forward and send `prompt_done` or `error`.
4. On `permission`: resolve the matching pending request; ignore unknown IDs.
5. On `cancel`: resolve every open permission as `cancelled`, then forward `session/cancel`.
6. On close/error: resolve pending permissions as cancelled; tear down agent; clear timers; remove the chat.
7. On agent process exit: send `closed` with the stderr tail; close the socket.
8. On `session/new` failure with auth methods: send `error` with `authMethods`; close.
9. On app shutdown: tear down every chat the same way as step 6.

Guard races: a WebSocket close while `initialize` is in flight must still kill the child.

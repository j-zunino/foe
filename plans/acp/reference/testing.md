# Testing

The backend is fully tested before any UI exists. Frontend work in M5–M7 is verified by the manual checklist only; there are no browser tests in v1.

## Unit tests

`apps/server/src/lib/db/db.test.ts`

- A fresh database gets the migrated `projects` table.
- Reopening a migrated file applies nothing, keeps its rows, and does not duplicate them.
- A path that cannot be opened throws with the resolved path in the message.
- Tests use `:memory:` or `mkdtemp`, never `./data/`.

`apps/server/src/lib/projects.test.ts` against `createDatabase({ filename: ":memory:", migrationsDir })`:

- Add, list, delete.
- `name` defaults to `basename(path)` when omitted; a provided name is trimmed.
- Relative, nonexistent, and non-directory paths are rejected.
- Duplicate canonical paths are rejected by the `UNIQUE` constraint.
- Reopening the same temporary database file returns the same ids and no duplicates.

`apps/server/src/routes/api/projects.test.ts`:

- Fastify `inject` against the real app factory: `400` for invalid body/path, `409` for duplicates, `404` for unknown ids, `201`/`204` on the happy path.
- Tests use `:memory:` or `mkdtemp` files and never touch `./data/foe.db`.

`apps/server/src/lib/agents.test.ts` and `apps/server/src/config.test.ts`:

- Agent ids are unique.
- `getRepoRoot()` resolves from `apps/server` and from the repo root.
- Relative `./` commands and args resolve against the repository root while the child still runs with the project `cwd`.
- `env` is preserved for the child but never returned by `GET /api/agents`.

## Integration tests

`apps/server/src/lib/chat.test.ts` starts the real app on port `0` with `buildApp({ db, agents })` using the fake preset, and spawns the fake agent.

Scenarios:

1. `start` returns `ready` with a session ID.
2. Prompt streams `update` frames and ends with `prompt_done: end_turn`.
3. Two concurrent chats get distinct session IDs and do not cross-deliver updates.
4. Permission request round-trips: selecting an advertised option resolves with `selected`; Cancel resolves with `cancelled`.
5. Permission option IDs are forwarded unmapped; the test uses the fake agent's non-obvious IDs.
6. Cancel on a slow prompt resolves any open permission request as `cancelled` and returns `stopReason: cancelled`.
7. A `fs/*` call from a misbehaving fake agent surfaces as a method-not-found error; the backend does not perform filesystem work.
8. `FAKE_AGENT_REQUIRE_AUTH=1` yields an `error` frame carrying `authMethods`; no `authenticate` request is sent.
9. Closing the WebSocket kills the agent process within the timeout.
10. Invalid client messages close the socket with `4001`; a missing `start` closes with `4000`.
11. `app.close()` kills every live agent process.

Run with `pnpm --filter @repo/server test`. Use `ws` as the test WebSocket client.

## Fake agent

`apps/server/fixtures/fake-agent.ts` is a standalone ACP agent using `acp.agent({ name })`. It registers its `initialize` handler first; the SDK rejects every other request with `-32600` until initialize succeeds. Request params are validated by the SDK before the handler runs.

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
    .onRequest(acp.methods.agent.session.new, () => ({
        sessionId: `fake-${process.pid}-s${++sessionCount}`,
    }))
    .onRequest(acp.methods.agent.session.prompt, ({ params, client }) =>
        runPrompt(params, client),
    )
    .onNotification(acp.methods.agent.session.cancel, () => {
        cancelled = true;
    });

app.connect(stream);
```

Behavior keyed by prompt text so tests are deterministic:

| Prompt contains | Behavior                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `permission`    | Emits a `tool_call`, then `session/request_permission` with deliberately non-obvious IDs (`proceed_once`, `proceed_always`, `cancel`) |
| `slow`          | Streams a chunk every 250 ms for 10 seconds                                                                                           |
| `unsupported`   | Calls `fs/read_text_file` even though the client advertised it as unsupported                                                         |
| anything else   | Streams two text chunks, emits a `tool_call`, and returns `end_turn`                                                                  |

Environment switches:

- `FAKE_AGENT_REQUIRE_AUTH=1`: `initialize` advertises an `authMethods` entry and `session/new` fails with an authentication error.
- `FAKE_AGENT_STDERR=1`: writes a known line to stderr so the stderr tail can be asserted.

It never makes network calls and never consumes model tokens. Use it as the default preset in `config/agents.example.json`.

## Manual checks

Backend (end of M4):

1. Configure the fake agent preset.
2. Add a project directory.
3. Open two chats in the same project with `wscat` and run prompts concurrently.
4. Exercise permission allow, reject, and cancel.
5. Cancel a slow prompt while a permission request is open.
6. Close a chat and verify no agent process remains (`ps`).
7. Repeat with OpenCode, Codex, etc. after logging in with each CLI.

UI (M5–M7):

1. Add and remove a project from the sidebar.
2. Create a chat per agent preset and send a prompt.
3. Switch chats while a background chat streams.
4. Resolve a permission request from the dialog; cancel one.
5. Stop a running prompt and confirm the dialog dismisses.
6. Kill an agent process and confirm the chat shows an ended/error state.

## Documentation checks

- A fresh clone can run the fake agent end to end using only the README.
- Every command in `docs/agent-presets.md` is copy-pasteable and uses absolute paths where required.
- The WS protocol example in `docs/protocol.md` matches `packages/protocol/src/ws.ts`.

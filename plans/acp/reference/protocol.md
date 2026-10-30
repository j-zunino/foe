# Wire protocol

The browser never speaks ACP. It uses REST for projects and presets, and one WebSocket per chat.

## REST API

Routes live under `apps/server/src/routes/api/` and are registered at `/api`. Responses are JSON. Errors are `{ "error": string }` with an appropriate status code.

| Method   | Path                | Body                  | Response                                  |
| -------- | ------------------- | --------------------- | ----------------------------------------- |
| `GET`    | `/api/health`       | —                     | `{ "ok": true }`                          |
| `GET`    | `/api/agents`       | —                     | `[{ "id", "name" }]`                      |
| `GET`    | `/api/projects`     | —                     | `[{ "id", "name", "path", "available" }]` |
| `POST`   | `/api/projects`     | `{ "path", "name"? }` | `201` project item                        |
| `DELETE` | `/api/projects/:id` | —                     | `204`                                     |

Validation:

- Parse each body with a zod schema via `safeParse`; return `400` before touching the store.
- `name` is optional. When provided it is non-empty after trimming; when omitted it defaults to `basename(path)` after canonicalization.
- `path` is absolute, exists, and is a directory.
- Store the canonical path (`fs.realpath`) to avoid symlink ambiguity.
- Reject duplicates by canonical path with `409`. The authority is the `UNIQUE` constraint on `projects.path`, not a read-then-write check.
- Project ids are UUIDs stored in SQLite and stay stable across restarts.
- `POST` returns the same object as a list item, `available` included.
- `GET /api/agents` returns only `id` and `name`. Never return `env` values.
- Fastify `bodyLimit` is set once in `buildApp` (1 MiB).

## WebSocket

Endpoint: `ws://127.0.0.1:8787/ws`, a `GET` route registered with `@fastify/websocket`.

- One socket per chat.
- The first message must be `start` within 10 seconds; otherwise close with code `4000`.
- Client messages are parsed with a zod discriminated union on `type`. Invalid JSON or an unknown/invalid message type closes the socket with code `4001`.
- Heartbeat: server ping every 30 seconds; terminate a socket that misses a pong.
- The plugin's `maxPayload` and the SDK's `ndJsonStream({ maxMessageBytes })` both use `acp.DEFAULT_MAX_MESSAGE_BYTES`.

### Client to server

```ts
type ClientMessage =
    | { type: "start"; projectId: string; agentId: string }
    | { type: "prompt"; text: string }
    | { type: "cancel" }
    | { type: "permission"; requestId: string; optionId: string | null };
```

`optionId: null` means cancel the permission request.

### Server to client

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

There is no `authenticate` message in v1. `authMethods` is only included so the UI can tell the user which CLI login flow to run when `session/new` fails.

`update` is forwarded as-is. The backend does not translate, filter, or buffer `SessionUpdate` payloads beyond checking `sessionId`.

## Example exchange

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

Option IDs are chosen by the agent and differ per adapter. The UI must send one of the `params.options[].optionId` values it received for that request. Never hardcode IDs such as `proceed_once`.

## Close codes

| Code   | Meaning                                        |
| ------ | ---------------------------------------------- |
| `4000` | Missing `start` within 10 seconds              |
| `4001` | Invalid JSON or unknown/invalid client message |

# WebSocket protocol

**Frozen for v1.** The messages below are the contract between the browser and the backend, pinned to `@agentclientprotocol/sdk` **2.1.0** (ACP v1). Changing them requires a new protocol version and a matching UI change.

The browser never speaks ACP. It sends and receives only the messages defined here; the backend is the ACP client. The source of truth is [`packages/protocol/src/ws.ts`](../packages/protocol/src/ws.ts).

REST (`/api`) is a separate, unrelated surface documented by its routes in `apps/server/src/routes/api/`.

## Endpoint

`ws://127.0.0.1:8787/ws` — a `GET` route registered with `@fastify/websocket`.

One socket owns exactly one chat: one agent process, one ACP session, one conversation. Chats are held in memory and end with the socket.

## Connection lifecycle

| Rule                | Behavior                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Start timeout       | The first message must be `start`, within 10 seconds. Otherwise the server closes with `4000`.                        |
| Invalid message     | Invalid JSON, an unknown `type`, or a body that fails validation closes the socket with `4001`.                       |
| Start failure       | Unknown project or agent preset, or a missing project directory: an `error` frame, then close `1011`.                 |
| Heartbeat           | The server pings every 30 seconds and terminates a socket that misses a pong (worst case about 60 seconds to detect). |
| Payload limit       | 32 MiB (`acp.DEFAULT_MAX_MESSAGE_BYTES`) for each WebSocket message and each ACP message on the agent stream.         |
| Duplicate `start`   | Rejected with `error: "chat already started"`; the socket stays open.                                                 |
| Prompt before start | Rejected with `error: "chat not started"`.                                                                            |
| Prompt while busy   | Rejected with `error: "prompt already running"`. One in-flight prompt per chat.                                       |
| Agent process exit  | The server sends `closed` (with the stderr tail when there is one) and then closes the socket.                        |

## Client messages

Validated by `clientMessageSchema` (zod, discriminated union on `type`):

```ts
type ClientMessage =
    | { type: "start"; projectId: string; agentId: string }
    | { type: "prompt"; text: string }
    | { type: "cancel" }
    | { type: "permission"; requestId: string; optionId: string | null };
```

- `start` — `projectId` is an id from `GET /api/projects`; `agentId` is an id from `GET /api/agents`. The agent starts with the project directory as its `cwd`.
- `prompt` — forwarded as a single text content block. `text` may contain slash commands; the backend does not interpret it.
- `cancel` — stops the running prompt. Before `start` it is ignored.
- `permission` — answers the `permission_request` with the matching `requestId`. `optionId` must be one of the `optionId` values from that request's `params.options`; **`null` cancels the request**. Unknown `requestId` values are ignored.

## Server messages

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

- `ready` — sent once a `start` succeeds. `chatId` identifies the chat; `sessionId` is the agent's ACP session id.
- `update` — an ACP `SessionUpdate` forwarded unchanged. The backend does not translate, filter, or buffer it beyond checking the session id.
- `permission_request` — the agent wants approval for a tool call. `requestId` correlates the answer; `params` is the ACP request.
- `prompt_done` — the turn finished. `stopReason` is one of `end_turn`, `max_tokens`, `max_turn_requests`, `refusal`, `cancelled`.
- `error` — `message` is human-readable. `detail` carries the agent's stderr tail when available. `authMethods` is present only when `session/new` failed because the agent needs a login; there is no `authenticate` message in v1.
- `closed` — the agent process exited on its own. `reason` is the stderr tail when non-empty.

`acp` types are imported type-only from `@agentclientprotocol/sdk`.

## Permissions

- Permission requests are per chat and cannot outlive their turn: when a prompt ends, any still-open request is settled as cancelled server-side.
- Option ids are chosen by the agent and differ per adapter. Use the ids and labels exactly as received; never hardcode names such as `proceed_once`.
- `cancel` resolves every open permission request as cancelled **before** notifying the agent. The turn then ends with `prompt_done` and `stopReason: "cancelled"`.

## Close codes

| Code   | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| `4000` | No `start` within 10 seconds.                              |
| `4001` | Invalid JSON or an unknown/invalid client message.         |
| `1011` | Agent start failed (an `error` frame precedes this close). |

A normal close after `closed` or after the client hangs up has no application code.

## Example exchange

```
client → { "type": "start", "projectId": "p1", "agentId": "fake" }
server → { "type": "ready", "chatId": "c1", "sessionId": "s1", "agentId": "fake" }

client → { "type": "prompt", "text": "Refactor the parser" }
server → { "type": "update", "update": { "sessionUpdate": "agent_message_chunk", ... } }
server → { "type": "permission_request", "requestId": "r1", "params": { ..., "options": [ ... ] } }
client → { "type": "permission", "requestId": "r1", "optionId": "<one of params.options>" }
server → { "type": "prompt_done", "stopReason": "end_turn" }

client → { "type": "prompt", "text": "Run the slow test" }
client → { "type": "cancel" }
server → { "type": "prompt_done", "stopReason": "cancelled" }

client closes the socket
server → kills the agent process group
```

Startup failure:

```
client → { "type": "start", "projectId": "gone", "agentId": "fake" }
server → { "type": "error", "message": "unknown project" }
server → close 1011
```

Auth failure:

```
client → { "type": "start", "projectId": "p1", "agentId": "codex" }
server → { "type": "error", "message": "...", "detail": "<stderr tail>", "authMethods": [ { "id": "...", "name": "..." } ] }
server → close 1011
```

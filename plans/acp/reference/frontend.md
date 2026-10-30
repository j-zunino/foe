# Frontend design

Everything here is implemented in M5–M7. The wire protocol is frozen at the end of M4; a UI requirement that needs a protocol change is a gap in M4.

Types come from `@repo/protocol` after M5. There is no `apps/web/src/protocol.ts` and no duplicated message types.

## State

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
- `selectedProjectId`, persisted in `localStorage`.

Chats are never persisted. A refresh starts empty. Projects are re-fetched from SQLite, so they survive a backend restart.

## Chat items

Render the subset of `SessionUpdate` that matters:

| Update                                   | Rendering                                    |
| ---------------------------------------- | -------------------------------------------- |
| `agent_message_chunk`                    | Append text to the current assistant message |
| `agent_thought_chunk`                    | Collapsed “thinking” block                   |
| `user_message_chunk`                     | Append to the user message                   |
| `tool_call`                              | Tool card keyed by `toolCallId`              |
| `tool_call_update`                       | Merge into the existing tool card            |
| `plan`                                   | Replace the current plan list                |
| `available_commands_update`              | Ignore in v1                                 |
| `current_mode_update`                    | Ignore in v1                                 |
| `config_option_update`                   | Ignore in v1                                 |
| `session_info_update`                    | Update the chat title if present             |
| `usage_update`, `notice`, `compaction_*` | Minimal text line                            |

Group text chunks by `messageId` when present; otherwise append to the last open message of the same role.

Never crash on an unknown `sessionUpdate`; ignore it.

Tool calls:

- Render `toolCall.content` entries. `type: "content"` is text or other content; `type: "diff"` shows the agent's own file change.
- Map `toolCall.kind` to an icon or color: `read`, `edit`, `delete`, `move`, `search`, `execute`, `think`, `fetch`, `switch_mode`, `other`.
- Map `toolCall.status`: `pending`, `in_progress`, `completed`, `failed`.
- `tool_call_update` carries only changed fields; merge by `toolCallId`.

Slash commands:

- Agents accept slash commands as plain text prompts. v1 just sends the typed text.
- `available_commands_update` can drive autocomplete later; no UI in v1.

## Connection lifecycle

- `createChat(projectId, agentId)` creates the chat with status `starting`, opens `/ws`, and sends `start` on open.
- The chat title is the first prompt text, truncated client-side, until `session_info_update` replaces it.
- The socket stays open while switching chats, so background chats keep streaming.
- `ready` sets the session ID and status `idle`.
- `prompt_done` sets status `idle` and re-enables input.
- `cancel` sets an optimistic “cancelling” flag; the final `prompt_done` with `cancelled` restores `idle`.
- `error` shows a banner; `closed` marks the chat ended and disables input.
- Closing a chat closes the socket; backend teardown follows.
- There is no automatic reconnect in v1. A refresh loses chats by design.

## Components

- `ProjectSidebar`: project list, add-project form (absolute path, optional name defaulting to the directory basename), remove button, unavailable badge.
- `ChatList`: chats for the selected project, new-chat button with agent picker defaulting to the first preset, running indicator.
- `ChatView`: scrollable update list; auto-scroll unless the user scrolled up; error banner; status line.
- `PromptInput`: textarea, Enter to send (Shift+Enter newline), disabled while running; Stop button.
- `PermissionDialog`: tool title, options grouped by `kind` (`allow_once`, `allow_always`, `reject_once`, `reject_always`), plus a Cancel button that sends `optionId: null`. Render option IDs and labels exactly as received.

Plain text in `<pre>`-like blocks is enough for v1. Markdown rendering is a later enhancement.

# ACP notes and resources

## ACP surface used

Agent-side methods the backend calls or notifies:

- `initialize` (request)
- `session/new` (request)
- `session/prompt` (request)
- `session/cancel` (notification)

Client-side handlers the backend implements:

- `session/update` (notification)
- `session/request_permission` (request)

That is the complete client role for v1.

Agent responsibilities:

- File reads, writes, and diffs, through its own tools.
- Terminal and command execution, through its own process.
- Authentication, through its own CLI login state.

Not implemented in v1:

- `authenticate`, `logout`
- `fs/read_text_file`, `fs/write_text_file`
- `terminal/create`, `terminal/output`, `terminal/release`, `terminal/wait_for_exit`, `terminal/kill`
- `session/load`, `session/list`, `session/delete`, `session/resume`, `session/close`
- `session/set_mode`, `session/set_config_option`
- `elicitation/*`
- MCP server configuration

Client capabilities advertised:

```ts
{
  fs: {
    readTextFile: false,
    writeTextFile: false,
  },
  terminal: false,
}
```

Explicit `false` tells the agent to use its own file and terminal tooling. Registering no `fs/*` or `terminal/*` handlers leaves the SDK's `method-not-found` response in place if an adapter calls them anyway.

Stop reasons: `end_turn`, `max_tokens`, `max_turn_requests`, `refusal`, `cancelled`. The UI treats every stop reason as “turn finished”; it only special-cases `cancelled` for the Stop button flow.

## SDK notes

`@agentclientprotocol/sdk` 2.1.0, protocol v1 on the stable entrypoint:

- **Named exports only, ESM only.** `import acp from "@agentclientprotocol/sdk"` does not exist; use `import * as acp from "@agentclientprotocol/sdk"`.
- **Handlers take one context object**, not `params`: `({ method, params, signal, agent, requestId }) => result`. Return the result directly.
- **`session/request_permission` response** is `{ outcome: { outcome: "selected", optionId } }` or `{ outcome: { outcome: "cancelled" } }`.
- **`session/prompt`** takes `prompt: ContentBlock[]`, so pass `[{ type: "text", text }]`.
- **`session/new`** requires both `cwd` and `mcpServers`.
- **`initialize`** requires `protocolVersion: acp.PROTOCOL_VERSION` (literal `1`).
- **`session/cancel`** is a notification, not a request.
- **`client(...).connect(stream)`** is synchronous and takes the `ndJsonStream(...)` result. `ndJsonStream(output, input, { maxMessageBytes })` is output-first.
- **Fake agents:** `acp.agent({...})` rejects every request except `initialize` with `-32600` until an initialize handler succeeds, and the SDK zod-validates params before the handler runs.
- **No example files ship in the package.** Examples exist only in the GitHub repository linked below.

## Agent preset reference

| Agent      | Command                                  | Notes                                               |
| ---------- | ---------------------------------------- | --------------------------------------------------- |
| Fake       | `tsx apps/server/fixtures/fake-agent.ts` | No tokens, no network                               |
| OpenCode   | `opencode acp`                           | Run `opencode auth login` first                     |
| Codex      | `npx -y @agentclientprotocol/codex-acp`  | Run `codex login` first; `@preview` exists          |
| Gemini CLI | `gemini --acp`                           | Older flag: `--experimental-acp`; may need ACP auth |

Verify exact package names and flags against the linked docs before writing them into the README; adapters change.

## Resources

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

- “Agent Client Protocol by Hand” (Gemini over stdio, permission flow, capability fallback): https://dev.to/gabrielanhaia/agent-client-protocol-by-hand-drive-gemini-acp-over-json-rpc-on-stdio-1jdj
- Hermes IDE terminal-first ADR (the opposite design; useful comparison): https://github.com/hermes-hq/hermes-ide/blob/main/docs/adr/003-terminal-first-vendor-neutral.md

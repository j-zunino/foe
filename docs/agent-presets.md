# Agent presets

Each chat launches one agent process from a preset in `config/agents.json`. Verified against each agent's own docs; commands here are copy-pasteable.

## Where presets live

```sh
cp config/agents.example.json config/agents.json
```

`config/agents.json` is gitignored. Shape:

```json
{
    "agents": [
        {
            "id": "fake",
            "name": "Fake agent (no tokens)",
            "command": "./apps/server/node_modules/.bin/tsx",
            "args": ["./apps/server/fixtures/fake-agent.ts"],
            "env": {}
        }
    ]
}
```

- `id` is what the client sends in `start` and what `GET /api/agents` returns. Ids must be unique.
- `command` and any `args` entry starting with `./` resolve against the **repo root**, not the package or the project. Bare names use `PATH`.
- The agent runs with the **project directory** as its `cwd`, so it reads that project's own config.
- `env` is merged over the server's environment for the child only. It is never logged and never returned by `GET /api/agents`.
- `GET /api/agents` exposes `id` and `name` only.

## Fake agent

The fake preset is the fastest way to confirm the whole stack. It makes no network calls, needs no tokens, and needs no install — `tsx` is a dev dependency of the server package.

```json
{
    "id": "fake",
    "name": "Fake agent (no tokens)",
    "command": "./apps/server/node_modules/.bin/tsx",
    "args": ["./apps/server/fixtures/fake-agent.ts"],
    "env": {}
}
```

Run it from the repo root:

```sh
pnpm --filter @repo/server dev
curl -s -X POST http://127.0.0.1:8787/api/projects \
  -H 'content-type: application/json' \
  -d "{\"path\":\"$PWD\"}"
pnpm dlx wscat -c ws://127.0.0.1:8787/ws
```

Then send `{"type":"start","projectId":"<id>","agentId":"fake"}`, followed by `{"type":"prompt","text":"hello"}`. Message shapes and close codes: [protocol.md](protocol.md).

Prompt text selects the behaviour:

| Prompt contains | Behaviour                                                                             |
| --------------- | ------------------------------------------------------------------------------------- |
| `permission`    | Emits a tool call, then a permission request with deliberately odd option ids         |
| `slow`          | Streams a chunk every 250 ms for 10 seconds, long enough to exercise `cancel`         |
| `unsupported`   | Calls `fs/read_text_file`; the backend answers method-not-found and the agent says so |
| anything else   | Two text chunks, one tool call, `end_turn`                                            |

Environment switches for the preset's `env`:

- `FAKE_AGENT_REQUIRE_AUTH=1` — `initialize` advertises an auth method and `session/new` fails, so you can see the `error` frame with `authMethods`.
- `FAKE_AGENT_STDERR=1` — writes a known line to stderr, which shows up in `error.detail` and `closed.reason`.

## OpenCode

```json
{
    "id": "opencode",
    "name": "OpenCode",
    "command": "opencode",
    "args": ["acp"],
    "env": {}
}
```

Log in once from a terminal, as the same user that runs the server:

```sh
opencode auth login
```

Notes:

- `opencode acp` talks ACP over stdin/stdout and exits when the client closes stdin. Run directly in a terminal it just sits there waiting for messages — that is expected.
- The adapter requires an absolute `cwd` and rejects a relative one. Projects are stored canonically, so this is already satisfied.
- One prompt at a time per session. A second concurrent prompt is an error, which matches this client's model.
- OpenCode offers a single auth method whose id is `opencode-login`. `authenticate` accepts only that id and does not collect credentials, so logging in from the terminal is the only path. If a provider is unauthenticated, prompts return ACP's `auth_required`.
- For stderr diagnostics, put `--print-logs` before `acp`: `"args": ["--print-logs", "acp"]`. Stdout stays clean for ACP.
- Built-in tools, custom tools, slash commands, MCP servers, and `AGENTS.md` rules all work over ACP. `/undo` and `/redo` are unsupported.

## Codex

```json
{
    "id": "codex",
    "name": "Codex",
    "command": "npx",
    "args": ["-y", "@agentclientprotocol/codex-acp@2.6.0"],
    "env": {}
}
```

Log in once:

```sh
codex login
```

Notes:

- `codex-acp` is a stdio adapter that starts the Codex App Server and translates ACP to Codex operations. It bundles a compatible `@openai/codex`, so the login above (or an API key) is all it needs.
- Auth: ChatGPT login, or an API key via `CODEX_API_KEY` (preferred) or `OPENAI_API_KEY`. Set `NO_BROWSER=1` in headless setups to hide the browser login method.
- Optional env: `CODEX_PATH` to run a different Codex binary than the bundled one, `CODEX_CONFIG` for a JSON object merged into the session config, `MODEL_PROVIDER` for the model provider, `INITIAL_AGENT_MODE` (`read-only`, `workspace-write`, `agent`, `agent-full-access`, or `permission-profile:<id>`), and `APP_SERVER_LOGS` for adapter logs.
- `@preview` tracks unreleased `main` builds: `npx -y @agentclientprotocol/codex-acp@preview`. Prefer the pinned release.

## Gemini CLI

```json
{
    "id": "gemini",
    "name": "Gemini CLI",
    "command": "gemini",
    "args": ["--acp"],
    "env": {}
}
```

Log in with the CLI first (`gemini` and follow the auth flow).

**Capability gap:** Gemini's ACP mode proxies file reads and writes through the client. This backend advertises `fs.readTextFile` and `writeTextFile` as `false` and implements neither, so file work fails with a method-not-found error. Treat Gemini as the weakest fit of the three and prefer agents that use their own tools.

Notes:

- Older builds use `--experimental-acp` instead of `--acp`.
- `gemini --acp --debug` writes ACP diagnostics to stderr, which surfaces in `error.detail` and `closed.reason`.
- Gemini CLI was replaced by Antigravity CLI for unpaid and Google One users, so availability and auth differ by account.

## Version pinning

Pin every `npx` preset to an exact version, as the Codex entry does. The wire protocol is frozen for v1, but an unpinned adapter can change its ACP behaviour under you. Bump a pin deliberately, then rerun `pnpm --filter @repo/server test` and one manual chat.

## Adding another agent

It is a good fit if it:

1. Speaks ACP over stdio (not HTTP, not a TUI).
2. Completes `initialize` when the client advertises `fs: { readTextFile: false, writeTextFile: false }` and `terminal: false`.
3. Completes `session/new` with `mcpServers: []`.
4. Tolerates one prompt at a time per session.

Known login commands and per-agent quirks belong in this file.

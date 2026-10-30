# Security and risks

## Security

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
| Project deletion                            | Delete the `projects` row only; never touch the directory                                                 |
| Database file                               | `data/` is gitignored and holds project names and absolute paths only, no credentials, prompts, or env    |
| SQLite writes                               | Single-row, synchronous, sub-millisecond. No long transactions or bulk history writes in handlers         |
| Refresh / restart                           | Chats are lost; projects persist in `data/foe.db` across backend restarts                                 |

## Risks

| Risk                                            | Impact                          | Mitigation                                                                                                            |
| ----------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Agent requires client fs or terminal            | Prompt fails or degrades        | Most harness agents fall back to their own tools. Verify intended agents early; add capabilities in v2 only if needed |
| Adapter calls an unadvertised method anyway     | Prompt error                    | SDK returns `method-not-found`; log it and surface the error                                                          |
| Agent requires ACP `authenticate`               | `session/new` fails             | v1 assumes CLI login. Surface the error and auth method names; add generic auth later                                 |
| Gemini CLI needs an API-key `authenticate` call | Cannot start without extra work | Use CLI login, or treat Gemini as a v1.1 auth task                                                                    |
| Adapter differences                             | Config/env quirks per agent     | Presets are user-editable; `docs/agent-presets.md` records tested commands                                            |
| Windows process cleanup                         | Orphan agents                   | Use `taskkill /pid <pid> /T /F` as the fallback                                                                       |
| Long-running prompts                            | Memory growth in the browser    | Cap rendered items per chat (e.g., 2,000) or virtualize later                                                         |
| WebSocket backpressure                          | Slow UI, memory growth          | Watch `bufferedAmount`; close misbehaving sockets in a later iteration                                                |
| UI work starts late                             | Protocol gaps found in M5       | M4 freezes the protocol and ships a `wscat` walkthrough                                                               |
| No reconnect                                    | Work lost on refresh            | Accepted v1; add session persistence and `session/load` later                                                         |
| Chats are ephemeral                             | Chat history lost on restart    | Accepted v1; chats and messages move into SQLite later                                                                |
| Synchronous SQLite                              | Blocks the event loop           | Writes are single-row and sub-millisecond                                                                             |
| Native module / prebuild mismatch               | `better-sqlite3` fails to load  | v13 is N-API with bundled prebuilds. Pin the version                                                                  |
| WAL sidecar files                               | Stray untracked files           | Ignore the whole `data/` directory                                                                                    |
| SDK changes                                     | Breakage on upgrade             | Pin the SDK version in the catalog; rerun integration tests on upgrade                                                |

# M4 — Hardening, documentation, protocol freeze

Status: todo
Depends on: M3
Refs: [Protocol](../reference/protocol.md), [Security and risks](../reference/security-and-risks.md), [Testing](../reference/testing.md#documentation-checks)

## Goal

Make the backend safe to leave running, document it for a fresh clone, and freeze the protocol for v1.

## Steps

- [ ] [M4.01 Teardown and heartbeat](01-teardown-heartbeat.md)
- [ ] [M4.02 Limits and process kill](02-limits-process-kill.md)
- [ ] [M4.03 Logging](03-logging.md)
- [ ] [M4.04 README](04-readme.md)
- [ ] [M4.05 Protocol doc](05-protocol-doc.md)
- [ ] [M4.06 Agent presets doc](06-agent-presets-doc.md)
- [ ] [M4.07 Documentation checks](07-docs-checks.md)

## Milestone done when

- [ ] Start two chats, kill the backend with `Ctrl+C`, verify no orphan agents
- [ ] Disconnect a socket and verify cleanup after the heartbeat timeout
- [ ] A fresh clone can run the fake agent end to end using only the README
- [ ] The documentation checks pass
- [ ] `docs/protocol.md` states the protocol is frozen and names the SDK version

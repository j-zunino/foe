# M2 — Agent process and ACP client

Status: todo
Depends on: M1
Refs: [Backend](../reference/backend.md#agent-process), [ACP notes](../reference/acp-notes.md), [Testing](../reference/testing.md#fake-agent)

## Goal

Spawn one ACP agent per chat, initialize it, create a session, and expose prompt, cancel, permissions, and teardown.

## Steps

- [ ] [M2.01 Fake agent](01-fake-agent.md)
- [ ] [M2.02 Spawn and initialize](02-spawn-and-init.md)
- [ ] [M2.03 Prompt, cancel, permissions](03-prompt-cancel-permissions.md)
- [ ] [M2.04 Script-level test](04-script-test.md)

## Milestone done when

- [ ] The backend can spawn the fake agent, initialize, create a session, and receive a prompt response
- [ ] No `fs/*` or `terminal/*` handler is registered
- [ ] An auth-required fake run produces an error frame with auth method summaries
- [ ] Killing the backend leaves no child processes

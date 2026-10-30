# M2.01 — Fake agent

Status: todo
Milestone: [M2](README.md)
Refs: [Fake agent](../reference/testing.md#fake-agent)

## Goal

A deterministic, token-free ACP agent for tests and manual demos.

## Changes

- `apps/server/fixtures/fake-agent.ts`
- `config/agents.example.json`

## Tasks

- [ ] Build an `acp.agent({ name: "fake" })`
- [ ] Register `initialize` first; the SDK rejects other requests until it succeeds
- [ ] Handle `session/new` and `session/prompt`
- [ ] Key behavior on prompt text: `permission`, `slow`, `unsupported`, default
- [ ] Emit non-obvious permission option IDs (`proceed_once`, `proceed_always`, `cancel`)
- [ ] Handle `session/cancel`
- [ ] Add `FAKE_AGENT_REQUIRE_AUTH=1` and `FAKE_AGENT_STDERR=1`
- [ ] Keep it network-free and token-free
- [ ] Make it the default preset

## Done when

- [ ] The fixture runs with `tsx`
- [ ] Each prompt branch is deterministic
- [ ] Auth and stderr switches work

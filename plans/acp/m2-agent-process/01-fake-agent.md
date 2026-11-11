# M2.01 — Fake agent

Status: done
Milestone: [M2](README.md)
Refs: [Fake agent](../reference/testing.md#fake-agent)

## Goal

A deterministic, token-free ACP agent for tests and manual demos.

## Changes

- `apps/server/fixtures/fake-agent.ts`
- `config/agents.example.json`

## Tasks

- [x] Build an `acp.agent({ name: "fake" })`
- [x] Register `initialize` first; the SDK rejects other requests until it succeeds
- [x] Handle `session/new` and `session/prompt`
- [x] Key behavior on prompt text: `permission`, `slow`, `unsupported`, default
- [x] Emit non-obvious permission option IDs (`proceed_once`, `proceed_always`, `cancel`)
- [x] Handle `session/cancel`
- [x] Add `FAKE_AGENT_REQUIRE_AUTH=1` and `FAKE_AGENT_STDERR=1`
- [x] Keep it network-free and token-free
- [x] Make it the default preset

## Done when

- [x] The fixture runs with `tsx`
- [x] Each prompt branch is deterministic
- [x] Auth and stderr switches work

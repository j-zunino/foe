# M4.06 — Agent presets documentation

Status: todo
Milestone: [M4](README.md)
Refs: [ACP notes](../reference/acp-notes.md#agent-preset-reference)

## Goal

Record tested commands, login steps, and known gaps per agent.

## Changes

- `docs/agent-presets.md` (new)

## Tasks

- [ ] Fake agent preset for token-free testing
- [ ] OpenCode: `opencode acp`, login with `opencode auth login`
- [ ] Codex: `npx -y @agentclientprotocol/codex-acp`, login with `codex login`
- [ ] Gemini CLI: `gemini --acp`, older `--experimental-acp`, auth warning
- [ ] Per-agent notes: `cwd`, env vars, auth method ids, capability gaps
- [ ] Version pinning guidance for `npx` presets

## Done when

- [ ] Every command is copy-pasteable
- [ ] Login steps are complete
- [ ] Adapter versions are pinned or called out

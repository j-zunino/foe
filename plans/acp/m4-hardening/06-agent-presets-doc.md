# M4.06 — Agent presets documentation

Status: done
Milestone: [M4](README.md)
Refs: [ACP notes](../reference/acp-notes.md#agent-preset-reference)

## Goal

Record tested commands, login steps, and known gaps per agent.

## Changes

- `docs/agent-presets.md` (new)

## Tasks

- [x] Fake agent preset for token-free testing
- [x] OpenCode: `opencode acp`, login with `opencode auth login`
- [x] Codex: `npx -y @agentclientprotocol/codex-acp`, login with `codex login`
- [x] Gemini CLI: `gemini --acp`, older `--experimental-acp`, auth warning
- [x] Per-agent notes: `cwd`, env vars, auth method ids, capability gaps
- [x] Version pinning guidance for `npx` presets

## Done when

- [x] Every command is copy-pasteable
- [x] Login steps are complete
- [x] Adapter versions are pinned or called out

## Verified facts

- OpenCode's single auth method id is `opencode-login`; `authenticate` does not collect credentials, so terminal login is the only path.
- Gemini CLI proxies file access through the client, so with no advertised `fs` capability its file work fails with method-not-found. Documented as a capability gap.
- Codex adapter pinned to `2.6.0` (current npm `latest`); `@preview` noted for unreleased builds.

# M4.04 — README

Status: todo
Milestone: [M4](README.md)
Refs: [Architecture](../reference/architecture.md)

## Goal

A fresh clone can understand, run, and troubleshoot the backend.

## Changes

- `README.md`

## Tasks

- [ ] What this is: a local UI orchestrator, not an agent harness
- [ ] Requirements: Node.js 24+, pnpm 12, agent CLIs
- [ ] Workspace commands: install, server dev, web dev, typecheck, lint, test
- [ ] Quick start with the fake agent
- [ ] How to add a project and a chat
- [ ] Persistence: `data/foe.db`, `DATABASE_FILE`, reset and backup
- [ ] Configure `config/agents.json` and the repo-root rule for `./` paths
- [ ] Login steps for real agents
- [ ] Security notes: loopback only, no sandbox, CLI owns credentials
- [ ] Troubleshooting: unsupported methods, auth failures, agent exit, orphan checks
- [ ] Link to the resources

## Done when

- [ ] A fresh clone can run the fake agent using only the README
- [ ] Commands are copy-pasteable

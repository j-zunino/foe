# M5 — Shared protocol package and frontend shell

Status: todo
Depends on: M4
Refs: [Frontend](../reference/frontend.md), [Architecture](../reference/architecture.md#repository-layout), [Dependencies](../reference/dependencies.md)

## Goal

Extract the frozen protocol into a package and stand up a Vite/React app that manages projects and starts chats.

## Steps

- [ ] [M5.01 Catalog dependencies](01-catalog-deps.md)
- [ ] [M5.02 Protocol package](02-protocol-package.md)
- [ ] [M5.03 Server imports](03-server-imports.md)
- [ ] [M5.04 Web scaffold](04-web-scaffold.md)
- [ ] [M5.05 API and app state](05-api-and-state.md)
- [ ] [M5.06 Project sidebar](06-project-sidebar.md)
- [ ] [M5.07 Chat list](07-chat-list.md)
- [ ] [M5.08 Acceptance](08-acceptance.md)

## Milestone done when

- [ ] `pnpm install`, then `pnpm build` builds protocol before server and web
- [ ] `pnpm typecheck` and `pnpm lint` pass across the workspace
- [ ] `pnpm --filter @repo/web dev` loads in the browser
- [ ] Projects can be added and removed from the UI
- [ ] Creating a chat opens a socket and reaches `ready`

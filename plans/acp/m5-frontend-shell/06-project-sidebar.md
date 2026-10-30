# M5.06 — Project sidebar

Status: todo
Milestone: [M5](README.md)
Refs: [Components](../reference/frontend.md#components), [REST API](../reference/protocol.md#rest-api)

## Goal

Add, select, and remove projects from the UI.

## Changes

- `apps/web/src/components/ProjectSidebar.tsx` (new)
- `apps/web/src/App.tsx`

## Tasks

- [ ] Render the project list
- [ ] Add-project form with an absolute path and optional name
- [ ] Default the name to the directory basename on the server
- [ ] Remove button with confirmation
- [ ] Unavailable badge for missing directories
- [ ] Select a project for the chat list

## Done when

- [ ] Projects can be added and removed from the UI
- [ ] The list refreshes from the backend
- [ ] Invalid paths show an error

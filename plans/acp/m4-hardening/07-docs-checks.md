# M4.07 — Documentation checks

Status: todo
Milestone: [M4](README.md)
Refs: [Documentation checks](../reference/testing.md#documentation-checks)

## Goal

Verify the docs work from a clean slate.

## Changes

- `README.md`
- `docs/protocol.md`
- `docs/agent-presets.md`

## Tasks

- [ ] A fresh clone runs the fake agent end to end using only the README
- [ ] Every command in `docs/agent-presets.md` is copy-pasteable
- [ ] Absolute paths are used where the backend requires them
- [ ] The WS example in `docs/protocol.md` matches `src/protocol.ts`
- [ ] Run the backend manual checklist

## Done when

- [ ] All documentation checks pass
- [ ] No stale paths or commands remain

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getRepoRoot } from "../lib/paths.js";
import { loadAgents } from "./agent.js";

const root = getRepoRoot();

function writePresets(agents: unknown): string {
    const dir = mkdtempSync(join(tmpdir(), "foe-agents-"));
    const file = join(dir, "agents.json");
    writeFileSync(file, JSON.stringify({ agents }));
    return file;
}

describe("loadAgents", () => {
    it("resolves ./ commands and args against the repo root", () => {
        const file = writePresets([
            {
                id: "fake",
                name: "Fake",
                command: "./apps/server/node_modules/.bin/tsx",
                args: ["./apps/server/fixtures/fake-agent.ts"],
                env: {},
            },
        ]);

        expect(loadAgents(file, root)).toMatchObject([
            {
                command: resolve(root, "apps/server/node_modules/.bin/tsx"),
                args: [resolve(root, "apps/server/fixtures/fake-agent.ts")],
            },
        ]);
    });

    it("leaves bare commands, flags, and env untouched", () => {
        const file = writePresets([
            {
                id: "codex",
                name: "Codex",
                command: "npx",
                args: ["-y", "@agentclientprotocol/codex-acp"],
                env: { TOKEN: "secret" },
            },
        ]);

        expect(loadAgents(file, root)).toMatchObject([
            {
                command: "npx",
                args: ["-y", "@agentclientprotocol/codex-acp"],
                env: { TOKEN: "secret" },
            },
        ]);
    });

    it("finds the repo root from the package dir and the repo root", () => {
        expect(getRepoRoot(resolve(root, "apps/server"))).toBe(root);
        expect(getRepoRoot(root)).toBe(root);
    });
});

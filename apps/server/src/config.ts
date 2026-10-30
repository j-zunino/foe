import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { z } from "zod";

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 8787;

const Env = z.object({
    HOST: z.string().min(1).default(DEFAULT_HOST),
    PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT),
    AGENTS_FILE: z.string().min(1).default("./config/agents.json"),
});

export type Config = z.infer<typeof Env>;

// Turbo runs tasks with the package dir as cwd, so relative paths need the repo root.
export function findRepoRoot(start = process.cwd()): string {
    let dir = resolve(start);
    while (!existsSync(join(dir, "pnpm-workspace.yaml"))) {
        const parent = dirname(dir);

        if (parent === dir) {
            throw new Error(
                `No pnpm-workspace.yaml found above ${start}; cannot locate the repository root`,
            );
        }

        dir = parent;
    }

    return dir;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
    const config = Env.parse(env);

    return {
        ...config,
        AGENTS_FILE: resolve(findRepoRoot(), config.AGENTS_FILE),
    };
}

const Preset = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()).default([]),
    env: z.record(z.string(), z.string()).default({}),
});

export type AgentPreset = z.infer<typeof Preset>;

export function loadAgents(file: string): AgentPreset[] {
    if (!existsSync(file)) {
        throw new Error(
            `Agent presets file not found: ${file} (copy config/agents.example.json)`,
        );
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
        throw new Error(`Agent presets file is not valid JSON: ${file}`, {
            cause: error,
        });
    }

    const result = z.object({ agents: z.array(Preset) }).safeParse(parsed);
    if (!result.success) {
        throw new Error(
            `Invalid agent presets in ${file}: ${result.error.message}`,
        );
    }

    const ids = new Set<string>();
    for (const agent of result.data.agents) {
        if (ids.has(agent.id))
            throw new Error(`Duplicate agent id "${agent.id}" in ${file}`);
        ids.add(agent.id);
    }

    return result.data.agents;
}

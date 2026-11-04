import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { agentPresetsFileSchema, type AgentPreset } from "@repo/protocol";
import { getRepoRoot } from "../lib/paths.js";

// `./` paths are relative to the repo root; turbo runs with the package dir as cwd.
function loadAgents(file: string, root = getRepoRoot()): AgentPreset[] {
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

    const result = agentPresetsFileSchema.safeParse(parsed);
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

    const resolveFromRoot = (value: string) =>
        value.startsWith("./") ? resolve(root, value) : value;

    return result.data.agents.map((agent) => ({
        ...agent,
        command: resolveFromRoot(agent.command),
        args: agent.args.map(resolveFromRoot),
    }));
}

export { loadAgents, type AgentPreset };

import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";

const Preset = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()).default([]),
    env: z.record(z.string(), z.string()).default({}),
});

type AgentPreset = z.infer<typeof Preset>;

function loadAgents(file: string): AgentPreset[] {
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

export { loadAgents, type AgentPreset };

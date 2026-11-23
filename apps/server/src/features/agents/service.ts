import type { AgentPreset, AgentSummary } from "@repo/protocol";

const agents = {
    list(presets: AgentPreset[]): AgentSummary[] {
        return presets.map(({ id, name }) => ({ id, name }));
    },
};

export { agents };

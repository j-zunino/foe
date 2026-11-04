import { z } from "zod";

const agentPresetSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()).default([]),
    env: z.record(z.string(), z.string()).default({}),
});

const agentPresetsFileSchema = z.object({
    agents: z.array(agentPresetSchema),
});

const agentSummarySchema = agentPresetSchema.pick({ id: true, name: true });
const agentsSchema = z.array(agentSummarySchema);

type AgentPreset = z.infer<typeof agentPresetSchema>;
type AgentPresetsFile = z.infer<typeof agentPresetsFileSchema>;
type AgentSummary = z.infer<typeof agentSummarySchema>;
type Agents = z.infer<typeof agentsSchema>;

export {
    agentPresetSchema,
    agentPresetsFileSchema,
    agentSummarySchema,
    agentsSchema,
    type AgentPreset,
    type AgentPresetsFile,
    type AgentSummary,
    type Agents,
};

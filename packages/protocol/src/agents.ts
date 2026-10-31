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

type AgentPreset = z.infer<typeof agentPresetSchema>;
type AgentPresetsFile = z.infer<typeof agentPresetsFileSchema>;

export {
    agentPresetSchema,
    agentPresetsFileSchema,
    type AgentPreset,
    type AgentPresetsFile,
};

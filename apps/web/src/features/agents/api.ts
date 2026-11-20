import type { Agents } from "@repo/protocol";
import { request } from "@/lib/http";

export const agentApi = {
    list: () => {
        return request<Agents>("/api/agents");
    },
};

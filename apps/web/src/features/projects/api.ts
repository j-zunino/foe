import type { Project, Projects } from "@repo/protocol";

import { request } from "@/lib/http";

// prettier-ignore
export const projectApi = {
    list: () => request<Projects>("/api/projects"),
    detail: (id: Project["id"]) => request<Project>(`/api/projects/${encodeURIComponent(id)}`),
};

import type { CreateProjectInput, Project, Projects } from "@repo/protocol";
import { request } from "@/lib/http.ts";

export const projectApi = {
    list: () => {
        return request<Projects>("/api/projects");
    },

    detail: (id: Project["id"]) => {
        return request<Project>(`/api/projects/${encodeURIComponent(id)}`);
    },

    add: (input: CreateProjectInput) => {
        return request<Project>("/api/projects", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },

    remove: (id: Project["id"]) => {
        return request<void>(`/api/projects/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });
    },
};

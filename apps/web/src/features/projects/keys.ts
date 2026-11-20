import type { Project } from "@repo/protocol";

// prettier-ignore
export const projectKeys = {
    all: ["projects"] as const,
    list: () => [...projectKeys.all, "list"] as const,
    detail: (id: Project["id"]) => [...projectKeys.all, "detail", id] as const,
};

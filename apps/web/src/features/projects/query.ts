import type { Project } from "@repo/protocol";
import { queryOptions } from "@tanstack/react-query";

import { projectApi } from "./api";
import { projectKeys } from "./keys";

export const projectQueries = {
    list: () => {
        return queryOptions({
            queryKey: projectKeys.list(),
            queryFn: () => projectApi.list(),
        });
    },

    detail: (id: Project["id"]) => {
        return queryOptions({
            queryKey: projectKeys.detail(id),
            queryFn: () => projectApi.detail(id),
        });
    },
};

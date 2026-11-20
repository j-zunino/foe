import type { CreateProjectInput, Project } from "@repo/protocol";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectApi } from "./api";
import { projectKeys } from "./keys";

export const projectMutations = {
    useAdd: () => {
        const queryClient = useQueryClient();

        return useMutation({
            mutationFn: (input: CreateProjectInput) => projectApi.add(input),
            onSuccess: () => {
                return queryClient.invalidateQueries({
                    queryKey: projectKeys.all,
                });
            },
        });
    },

    useRemove: () => {
        const queryClient = useQueryClient();

        return useMutation({
            mutationFn: (id: Project["id"]) => projectApi.remove(id),
            onSuccess: () => {
                return queryClient.invalidateQueries({
                    queryKey: projectKeys.all,
                });
            },
        });
    },
};

import { toast } from "@/components/ui/toast";
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
            onError: (error) => {
                toast.add({
                    id: "add-project-error",
                    type: "error",
                    title: "Couldn't add project",
                    description: error.message,
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
            onError: (error) => {
                toast.add({
                    id: "remove-project-error",
                    type: "error",
                    title: "Couldn't remove project",
                    description: error.message,
                });
            },
        });
    },
};

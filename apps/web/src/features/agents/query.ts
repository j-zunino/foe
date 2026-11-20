import { queryOptions } from "@tanstack/react-query";

import { agentApi } from "./api";
import { agentKeys } from "./keys";

export const agentQueries = {
    list: () => {
        return queryOptions({
            queryKey: agentKeys.list(),
            queryFn: () => agentApi.list(),
            staleTime: Infinity,
        });
    },
};

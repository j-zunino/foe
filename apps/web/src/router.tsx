import { createQueryClient } from "@/lib/query-client.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { routeTree } from "@/routeTree.gen";

function getRouter() {
    const queryClient = createQueryClient();

    return createRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: "intent",
        defaultPreloadStaleTime: 0,
        scrollRestoration: true,
        Wrap: ({ children }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        ),
    });
}

export const router = getRouter();

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

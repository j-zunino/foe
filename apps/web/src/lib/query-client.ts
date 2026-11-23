import { toast } from "@/components/ui/toast.tsx";
import { ApiError } from "@/lib/http.ts";
import { QueryCache, QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
    const queryCache = new QueryCache({
        onError: (error) => {
            toast.add({
                id: "query-error",
                type: "error",
                title: "Request failed",
                description: error.message,
            });
        },
    });

    return new QueryClient({
        queryCache,
        defaultOptions: {
            queries: {
                staleTime: 60_000,
                gcTime: 10 * 60_000,
                refetchOnWindowFocus: false,
                // 4xx won't resolve by retrying; give 5xx a couple of attempts
                retry: (failureCount, error) => {
                    if (
                        error instanceof ApiError &&
                        error.status >= 400 &&
                        error.status < 500
                    ) {
                        return false;
                    }

                    return failureCount < 2;
                },
            },
            mutations: { retry: 0 },
        },
    });
}

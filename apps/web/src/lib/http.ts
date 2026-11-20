import type { ErrorResponse } from "@repo/protocol";

export class ApiError extends Error {
    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: {
            // NOTE: Fastify rejects a content type with no body (DELETE)
            ...(init?.body ? { "Content-Type": "application/json" } : {}),
            ...init?.headers,
        },
    });

    if (!response.ok) {
        const body: ErrorResponse | null = await response
            .json()
            .catch(() => null);

        throw new ApiError(
            response.status,
            body?.message ?? response.statusText,
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

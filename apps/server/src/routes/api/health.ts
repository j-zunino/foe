import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.get(
        "/",
        { schema: { response: { 200: z.object({ ok: z.literal(true) }) } } },
        () => ({ ok: true as const }),
    );
};

export { healthRoutes };

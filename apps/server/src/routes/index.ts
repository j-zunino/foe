import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";

import { healthRoutes } from "./api/health.js";

const routes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.register(healthRoutes, { prefix: "/health" });
}

export { routes };

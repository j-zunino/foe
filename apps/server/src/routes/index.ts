import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./api/health.js";

async function routes(fastify: FastifyInstance) {
    fastify.register(healthRoutes, { prefix: "/health" });
}

export { routes };

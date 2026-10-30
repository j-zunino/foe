import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./api/health.js";

function routes(fastify: FastifyInstance) {
    fastify.register(healthRoutes, { prefix: "/health" });
}

export { routes };

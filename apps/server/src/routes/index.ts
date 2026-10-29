import type { FastifyPluginAsync } from "fastify";
import { healthRoutes } from "./api/health.js";

const routes: FastifyPluginAsync = async (fastify) => {
    fastify.register(healthRoutes, { prefix: "/health" });
};

export { routes };

import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";

import { healthRoutes } from "./api/health.js";
import { projectsRoutes } from "./api/projects.js";

const routes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.register(healthRoutes, { prefix: "/health" });
    fastify.register(projectsRoutes, { prefix: "/projects" });
};

export { routes };

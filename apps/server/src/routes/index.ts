import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";

import { agentsRoutes } from "./api/agents.js";
import { healthRoutes } from "./api/health.js";
import { projectsRoutes } from "./api/projects.js";

const routes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.register(healthRoutes, { prefix: "/health" });
    fastify.register(projectsRoutes, { prefix: "/projects" });
    fastify.register(agentsRoutes, { prefix: "/agents" });
};

export { routes };

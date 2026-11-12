import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";

import { agentsRoutes } from "./api/agents.js";
import { healthRoutes } from "./api/health.js";
import { projectsRoutes } from "./api/projects.js";
import { chatRoutes } from "./ws/chat.js";

const routes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.register(
        async (api) => {
            api.register(healthRoutes, { prefix: "/health" });
            api.register(projectsRoutes, { prefix: "/projects" });
            api.register(agentsRoutes, { prefix: "/agents" });
        },
        { prefix: "/api" },
    );

    fastify.register(chatRoutes);
};

export { routes };

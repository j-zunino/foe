import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";

import { agentsRoutes } from "./features/agents/index.js";
import { chatRoutes } from "./features/chat/index.js";
import { healthRoutes } from "./features/health/index.js";
import { projectsRoutes } from "./features/projects/index.js";

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

import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { agentsSchema } from "@repo/protocol";
import { agents } from "../../services/agents.js";

const agentsRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.get(
        "/",
        { schema: { response: { 200: agentsSchema } } },
        () => agents.list(fastify.agents),
    );
};

export { agentsRoutes };

import { FastifyPluginAsync } from "fastify";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get("/", async () => {
        return { ok: true };
    });
};

export { healthRoutes };

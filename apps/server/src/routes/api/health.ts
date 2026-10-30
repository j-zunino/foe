import type { FastifyInstance } from "fastify";

async function healthRoutes(fastify: FastifyInstance) {
    fastify.get("/", async () => {
        return { ok: true };
    });
}

export { healthRoutes };

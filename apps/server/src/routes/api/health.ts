import type { FastifyInstance } from "fastify";

function healthRoutes(fastify: FastifyInstance) {
    fastify.get("/", () => {
        return { ok: true };
    });
}

export { healthRoutes };

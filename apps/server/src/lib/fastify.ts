import Fastify from "fastify";

function buildApp() {
    return Fastify({ logger: true });
}

export { buildApp };

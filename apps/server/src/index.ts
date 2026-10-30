import { config } from "./config.js";
import { buildApp } from "./lib/fastify.js";
import { routes } from "./routes/index.js";

const fastify = buildApp();

fastify.register(routes, { prefix: "/api" });

await fastify.listen({ host: config.DEFAULT_HOST, port: config.DEFAULT_PORT });

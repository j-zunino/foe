import Fastify from "fastify";
import { config } from "./config.js";
import { routes } from "./routes/index.js";

const fastify = Fastify({ logger: true });

fastify.register(routes, { prefix: "/api" });

await fastify.listen({ host: config.DEFAULT_HOST, port: config.DEFAULT_PORT });

import { loadAgents, loadConfig } from "./config.js";
import { buildApp } from "./lib/fastify.js";
import { routes } from "./routes/index.js";

const config = loadConfig();
const agents = loadAgents(config.AGENTS_FILE);

const fastify = buildApp();

fastify.log.info({ agents: agents.map((agent) => agent.id) }, "agent presets loaded");
fastify.register(routes, { prefix: "/api" });

await fastify.listen({ host: config.HOST, port: config.PORT });

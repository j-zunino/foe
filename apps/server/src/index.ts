import { resolve } from "node:path";
import { loadAgents } from "./config/agent.js";
import { loadConfig } from "./config/env.js";
import { createDatabase } from "./lib/db/index.js";
import { buildApp } from "./lib/fastify.js";
import { getRepoRoot } from "./lib/paths.js";
import { routes } from "./routes/index.js";

const root = getRepoRoot();
const config = loadConfig();
const agents = loadAgents(config.AGENTS_FILE);

const database = createDatabase({
    filename: config.DATABASE_FILE,
    migrationsDir: resolve(root, "database/migrations"),
});

const fastify = buildApp(database);

fastify.log.info({
    agents: agents.map((agent) => agent.id),
    database: config.DATABASE_FILE,
});

fastify.register(routes, { prefix: "/api" });

await fastify.listen({ host: config.HOST, port: config.PORT });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, async () => {
        await fastify.close();
        process.exit(0);
    });
}

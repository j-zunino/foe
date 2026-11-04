import { resolve } from "node:path";
import { loadAgents } from "./config/agent.js";
import { loadConfig } from "./config/env.js";
import { createDatabase } from "./lib/db/index.js";
import { buildApp } from "./lib/fastify.js";
import { getRepoRoot } from "./lib/paths.js";
import { routes } from "./routes/index.js";

let fastify: ReturnType<typeof buildApp> | undefined;

try {
    const root = getRepoRoot();
    const config = loadConfig();
    const agents = loadAgents(config.AGENTS_FILE, root);

    const database = createDatabase({
        filename: config.DATABASE_FILE,
        migrationsDir: resolve(root, "database/migrations"),
    });

    fastify = buildApp(database);

    fastify.log.info({
        agents: agents.map((agent) => agent.id),
        database: config.DATABASE_FILE,
    });

    fastify.register(routes, { prefix: "/api" });

    await fastify.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
    if (fastify) {
        fastify.log.error({ err: error }, "Failed to start server");
        await fastify.close().catch(() => undefined);
    } else {
        console.error("Failed to start server", error);
    }

    process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, async () => {
        try {
            await fastify.close();
        } catch (error) {
            fastify.log.error({ err: error }, "failed to close server");
        }

        process.exit(0);
    });
}

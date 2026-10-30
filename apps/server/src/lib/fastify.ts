import Fastify from "fastify";

import type { AppDatabase, DatabaseHandle, Sqlite } from "./db/index.js";

declare module "fastify" {
    interface FastifyInstance {
        db: AppDatabase;
        sqlite: Sqlite;
    }
}

function buildApp({ db, sqlite }: DatabaseHandle) {
    const app = Fastify({ logger: true });

    app.decorate("db", db);
    app.decorate("sqlite", sqlite);
    app.addHook("onClose", async () => {
        sqlite.close();
    });

    return app;
}

export { buildApp };

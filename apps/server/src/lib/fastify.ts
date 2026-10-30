import Fastify from "fastify";

import type { AppDatabase, DatabaseHandle, Sqlite } from "./db/index.js";

declare module "fastify" {
    interface FastifyInstance {
        db: AppDatabase;
        sqlite: Sqlite;
    }
}

function buildApp({ db, sqlite }: DatabaseHandle) {
    const app = Fastify({ logger: true, bodyLimit: 1024 * 1024 });

    app.decorate("db", db);
    app.decorate("sqlite", sqlite);
    app.addHook("onClose", (instance, done) => {
        instance.sqlite.close();
        done();
    });

    return app;
}

export { buildApp };

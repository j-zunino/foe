import Fastify from "fastify";
import {
    hasZodFastifySchemaValidationErrors,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "@fastify/type-provider-zod";

import type { AppDatabase, DatabaseHandle, Sqlite } from "./db/index.js";

declare module "fastify" {
    interface FastifyInstance {
        db: AppDatabase;
        sqlite: Sqlite;
    }
}

function buildApp({ db, sqlite }: DatabaseHandle) {
    const app = Fastify({ logger: true, bodyLimit: 1024 * 1024 })
        .setValidatorCompiler(validatorCompiler)
        .setSerializerCompiler(serializerCompiler)
        .withTypeProvider<ZodTypeProvider>();

    app.setErrorHandler((error, _request, reply) => {
        if (hasZodFastifySchemaValidationErrors(error)) {
            return reply.code(400).send({
                error: error.validation[0]?.message ?? "invalid request",
            });
        }

        return reply.send(error);
    });

    app.decorate("db", db);
    app.decorate("sqlite", sqlite);
    app.addHook("onClose", (instance, done) => {
        instance.sqlite.close();
        done();
    });

    return app;
}

export { buildApp };

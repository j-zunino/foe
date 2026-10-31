import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import type { ErrorResponse } from "@repo/protocol";
import Fastify, { type FastifyError } from "fastify";
import type { AppDatabase, DatabaseHandle, Sqlite } from "./db/index.js";

declare module "fastify" {
    interface FastifyInstance {
        db: AppDatabase;
        sqlite: Sqlite;
    }
}

function buildApp({ db, sqlite }: DatabaseHandle) {
    const fastify = Fastify({ logger: true, bodyLimit: 1024 * 1024 })
        .setValidatorCompiler(validatorCompiler)
        .setSerializerCompiler(serializerCompiler)
        .withTypeProvider<ZodTypeProvider>();

    fastify.setNotFoundHandler((_request, reply) =>
        reply.code(404).send({
            statusCode: 404,
            message: "Route not found",
        } satisfies ErrorResponse),
    );

    fastify.setErrorHandler<FastifyError>((error, request, reply) => {
        // Fastify only normalizes the code in its own handler; anything below 400 is treated as a 5xx.
        const statusCode =
            error.statusCode !== undefined && error.statusCode >= 400
                ? error.statusCode
                : 500;

        // Unexpected failures: log the detail, never send it to the client.
        if (statusCode >= 500) {
            request.log.error({ err: error }, "Request failed");

            return reply.code(500).send({
                statusCode: 500,
                message: "Internal Server Error",
            } satisfies ErrorResponse);
        }

        // Deliberate failures (see httpError) and validation errors; message is already formatted.
        return reply.code(statusCode).send({
            statusCode,
            message: error.message,
        } satisfies ErrorResponse);
    });

    fastify.decorate("db", db);
    fastify.decorate("sqlite", sqlite);
    fastify.addHook("onClose", (instance, done) => {
        instance.sqlite.close();
        done();
    });

    return fastify;
}

export { buildApp };

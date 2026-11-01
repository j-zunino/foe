import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { createProjectSchema } from "@repo/protocol";
import { basename } from "node:path";
import { resolveDirectory } from "../../lib/paths.js";
import { projects } from "../../services/projects.js";

const projectsRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post(
        "/",
        {
            schema: {
                body: createProjectSchema,
            },
        },
        async (request, reply) => {
            const { path, name } = request.body;
            const canonical = await resolveDirectory(path);

            const project = await projects.create(fastify.db, {
                name: name ?? basename(canonical),
                path: canonical,
            });

            return reply.code(201).send({ ...project, available: true });
        },
    );
};

export { projectsRoutes };

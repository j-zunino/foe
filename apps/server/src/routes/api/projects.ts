import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import {
    createProjectSchema,
    projectSchema,
    projectsSchema,
} from "@repo/protocol";
import { basename } from "node:path";
import { resolveDirectory } from "../../lib/paths.js";
import { projects } from "../../services/projects.js";

const projectsRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.get(
        "/",
        {
            schema: { response: { 200: projectsSchema } },
        },
        async (_request, reply) => {
            const list = await projects.list(fastify.db);

            return reply.code(200).send(list);
        },
    );

    fastify.post(
        "/",
        {
            schema: {
                body: createProjectSchema,
                response: { 201: projectSchema },
            },
        },
        async (request, reply) => {
            const { path, name } = request.body;
            const canonical = await resolveDirectory(path);

            const project = await projects.create(fastify.db, {
                name: name ?? basename(canonical),
                path: canonical,
            });

            return reply.code(201).send(project);
        },
    );
};

export { projectsRoutes };

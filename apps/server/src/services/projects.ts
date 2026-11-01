import type { CreateProjectInput } from "@repo/protocol";
import { randomUUID } from "crypto";
import type { AppDatabase } from "../lib/db/index.js";
import { projects as projectsTable } from "../lib/db/schema.js";
import { httpError } from "../lib/http-error.js";

const projects = {
    async create(db: AppDatabase, input: CreateProjectInput) {
        const [project] = await db
            .insert(projectsTable)
            .values({
                id: randomUUID(),
                name: input.name,
                path: input.path,
            })
            .onConflictDoNothing()
            .returning();

        if (!project) {
            throw httpError(409, "project already exists");
        }

        return project;
    },
};

export { projects };

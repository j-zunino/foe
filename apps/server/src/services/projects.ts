import type { CreateProjectInput, Project } from "@repo/protocol";
import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm/sqlite-core/expressions";
import type { AppDatabase } from "../lib/db/index.js";
import { projects as projectsTable } from "../lib/db/schema.js";
import { httpError } from "../lib/http-error.js";

const projects = {
    async list(db: AppDatabase) {
        return db
            .select()
            .from(projectsTable)
            .orderBy(asc(projectsTable.createdAt), asc(projectsTable.id));
    },

    get(db: AppDatabase, id: Project["id"]) {
        return db
            .select()
            .from(projectsTable)
            .where(eq(projectsTable.id, id))
            .get();
    },

    async add(db: AppDatabase, input: CreateProjectInput & { name: string }) {
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

    async remove(db: AppDatabase, id: Project["id"]) {
        const [project] = await db
            .delete(projectsTable)
            .where(eq(projectsTable.id, id))
            .returning();

        return project;
    },
};

export { projects };

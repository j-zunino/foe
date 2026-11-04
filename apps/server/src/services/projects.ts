import type { CreateProjectInput } from "@repo/protocol";
import { randomUUID } from "crypto";
import type { AppDatabase } from "../lib/db/index.js";
import { projects as projectsTable } from "../lib/db/schema.js";
import { httpError } from "../lib/http-error.js";
import { asc } from "drizzle-orm/sqlite-core/expressions";

const projects = {
    async list(db: AppDatabase) {
        return db
            .select()
            .from(projectsTable)
            .orderBy(asc(projectsTable.createdAt))
            .limit(10);
    },

    async create(db: AppDatabase, input: CreateProjectInput) {
    async add(db: AppDatabase, input: CreateProjectInput) {
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

import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const projects = sqliteTable("projects", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    path: text("path").notNull().unique(),
    // ISO-8601 UTC text (e.g. 2026-10-30T12:00:00.000Z), so `Project.createdAt` is a string.
    createdAt: text("created_at")
        .notNull()
        .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

type Project = typeof projects.$inferSelect;

export { projects, type Project };

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import * as schema from "./schema.js";

interface DatabaseOptions {
    filename: string;
    migrationsDir: string;
}

export type DatabaseHandle = ReturnType<typeof createDatabase>;
export type AppDatabase = DatabaseHandle["db"];
export type Sqlite = DatabaseHandle["sqlite"];

export function createDatabase({ filename, migrationsDir }: DatabaseOptions) {
    let sqlite: InstanceType<typeof Database>;

    try {
        if (filename !== ":memory:") {
            mkdirSync(dirname(filename), { recursive: true });
        }

        sqlite = new Database(filename);
    } catch (error) {
        throw new Error(`Cannot open database at ${filename}`, { cause: error });
    }

    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("busy_timeout = 5000");

    try {
        const db = drizzle(sqlite, { schema });

        migrate(db, { migrationsFolder: migrationsDir });

        return { sqlite, db };
    } catch (error) {
        sqlite.close();
        throw error;
    }
}

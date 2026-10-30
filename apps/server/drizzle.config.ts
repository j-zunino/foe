import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

import { defaults } from "./src/config/env.js";
import { getRepoRoot } from "./src/lib/paths.js";

const root = getRepoRoot();

export default defineConfig({
    schema: "./src/lib/db/schema.ts",
    out: resolve(root, "database/migrations"),
    dialect: "sqlite",
    dbCredentials: {
        url: resolve(root, defaults.DATABASE_FILE),
    },
});

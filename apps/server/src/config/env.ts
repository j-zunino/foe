import { resolve } from "node:path";
import { z } from "zod";
import { getRepoRoot } from "../lib/paths.js";

// Fallbacks for loadConfig — not the loaded config itself.
const defaults = {
    HOST: "127.0.0.1",
    PORT: 8787,
    AGENTS_FILE: "./config/agents.json",
    DATABASE_FILE: "./data/foe.db",
};

const Env = z.object({
    HOST: z.string().min(1).default(defaults.HOST),
    PORT: z.coerce.number().int().min(1).max(65535).default(defaults.PORT),
    AGENTS_FILE: z.string().min(1).default(defaults.AGENTS_FILE),
    DATABASE_FILE: z.string().min(1).default(defaults.DATABASE_FILE),
});

type Config = z.infer<typeof Env>;

function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
    const config = Env.parse(env);
    const root = getRepoRoot();

    return {
        ...config,
        AGENTS_FILE: resolve(root, config.AGENTS_FILE),
        DATABASE_FILE:
            config.DATABASE_FILE === ":memory:"
                ? ":memory:"
                : resolve(root, config.DATABASE_FILE),
    };
}

export { defaults, loadConfig, type Config };

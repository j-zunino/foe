import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Turbo runs tasks with the package dir as cwd, so relative paths need the repo root.
function getRepoRoot(start = process.cwd()): string {
    let current = resolve(start);

    while (true) {
        if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
            return current;
        }

        const parent = dirname(current);

        if (parent === current) {
            throw new Error("Could not locate the repository root");
        }

        current = parent;
    }
}

export { getRepoRoot };

import { existsSync } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { httpError } from "./http-error.js";

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

// Validate absolute, existing directory and returns its canonical path.
async function resolveDirectory(path: string) {
    if (!isAbsolute(path)) {
        throw httpError(400, "path must be absolute");
    }

    const canonical = await realpath(path).catch(() => null);
    if (canonical === null) {
        throw httpError(400, "path does not exist");
    }

    const info = await stat(canonical).catch(() => null);
    if (info === null) {
        throw httpError(400, "path does not exist");
    }

    if (!info.isDirectory()) {
        throw httpError(400, "path is not a directory");
    }

    return canonical;
}

export { getRepoRoot, resolveDirectory };

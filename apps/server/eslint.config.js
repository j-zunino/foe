import { defineConfig } from "eslint/config";
import node from "@repo/eslint-config/node";

export default defineConfig(node, {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
        parserOptions: {
            tsconfigRootDir: import.meta.dirname,
        },
    },
});

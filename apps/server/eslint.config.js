import node from "@repo/eslint-config/node";
import { defineConfig } from "eslint/config";

export default defineConfig(
    node,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ["**/routes/**/*.ts"],
        rules: {
            // Route plugins are typed as async by Fastify but often only register routes.
            "@typescript-eslint/require-await": "off",
        },
    },
);

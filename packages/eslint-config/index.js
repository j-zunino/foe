import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

export default defineConfig(
    {
        ignores: [
            "**/dist/**",
            "**/node_modules/**",
            "**/.turbo/**",
            "**/coverage/**",
            "**/routeTree.gen.ts",
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        plugins: {
            "import-x": importX,
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
        settings: {
            "import-x/extensions": [".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx"],
            "import-x/resolver-next": [
                createTypeScriptImportResolver({
                    project: "./tsconfig.json",
                }),
            ],
        },
        rules: {
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/no-inferrable-types": "error",
            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/require-await": "error",
            "import-x/no-cycle": ["error", { ignoreExternal: true }],
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["../../**"],
                            message:
                                "Import with an alias or a direct sibling path; avoid two or more '../' segments.",
                        },
                        {
                            regex: "^@/features/[^/]+$",
                            message:
                                "Import the file that defines the symbol, not a feature folder or index.",
                        },
                        {
                            regex:
                                "^@/(features|components|components/ui|lib|hooks)$",
                            message:
                                "Import a specific file, not a folder.",
                        },
                    ],
                },
            ],
        },
    },
    {
        // Package entry points and framework files that re-export by design.
        files: ["**/src/index.ts", "**/index.ts", "**/index.js"],
        rules: {
            "import-x/no-cycle": "off",
        },
    },
    prettier,
);

import { defineConfig } from "eslint/config";
import react from "@repo/eslint-config/react";

export default defineConfig(
    react,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parserOptions: { tsconfigRootDir: import.meta.dirname },
        },
    },
    {
        files: ["src/components/**/*.tsx", "src/routes/**/*.tsx"],
        rules: { "react-refresh/only-export-components": "off" },
    },
);

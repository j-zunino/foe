import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  prettier,
);

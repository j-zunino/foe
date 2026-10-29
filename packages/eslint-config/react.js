import { defineConfig } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import base from "./index.js";

export default defineConfig(
  base,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite(),
);

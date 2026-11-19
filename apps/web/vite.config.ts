import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [devtools(), tanstackRouter(), react(), tailwindcss()],
    resolve: {
        alias: { "@": resolve(import.meta.dirname, "./src") },
    },
    server: {
        proxy: {
            "/api": "http://127.0.0.1:8787",
            "/ws": { target: "http://127.0.0.1:8787", ws: true },
        },
    },
});

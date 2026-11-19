import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { createQueryClient } from "@/lib/query-client.ts";

const queryClient = createQueryClient();

const root = document.getElementById("root");
if (!root) {
    throw new Error("Missing #root element");
}

createRoot(root).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </QueryClientProvider>
    </StrictMode>,
);

import { ThemeProvider } from "@/components/theme-provider.tsx";
import { router } from "@/router.tsx";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
    throw new Error("Missing #root element");
}

createRoot(root).render(
    <StrictMode>
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>
    </StrictMode>,
);

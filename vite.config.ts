import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tailwindcss from "@tailwindcss/vite";
  import path from "path";
  import { fileURLToPath } from "url";

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "react-i18next": path.resolve(__dirname, "src/i18n/react-i18next-shim.ts"),
        "i18next": path.resolve(__dirname, "src/i18n/i18next-shim.ts"),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: "dist",
    },
  });
  
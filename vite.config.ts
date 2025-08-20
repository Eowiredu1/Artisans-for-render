import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ESM replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig(async () => {
  // Dynamically import Replit plugins only if running in Replit
  const replitPlugins = isReplit
    ? [
        (await import("@replit/vite-plugin-runtime-error-modal")).default(),
        ...(process.env.NODE_ENV !== "production"
          ? [
              (await import("@replit/vite-plugin-cartographer")).cartographer(),
            ]
          : []),
      ]
    : [];

  return {
    root: path.resolve(__dirname, "client"),
    plugins: [react(), ...replitPlugins],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});

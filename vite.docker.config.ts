// Config Vite para build Docker (EasyPanel) — SPA estático puro.
// NÃO usa @lovable.dev/vite-tanstack-config para evitar o @cloudflare/vite-plugin
// que direciona o output para Cloudflare Workers em vez de dist/.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});

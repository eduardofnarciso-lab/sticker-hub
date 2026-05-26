// Config Vite para build Docker (EasyPanel) — SPA estático puro.
// NÃO usa @lovable.dev/vite-tanstack-config para evitar o @cloudflare/vite-plugin
// que direciona o output para Cloudflare Workers em vez de dist/.
//
// TanStackRouterVite foi REMOVIDO intencionalmente desta config:
// o plugin regenera o routeTree.gen.ts durante o build e pode truncá-lo
// quando encontra sintaxe complexa nos arquivos de rota.
// O routeTree.gen.ts já está correto e commitado no git — usamos ele diretamente.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});

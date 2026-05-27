/**
 * ROTA SEO PROGRAMÁTICO: /figurinha/:numero
 *
 * Objetivo futuro: Uma página por figurinha, indexável no Google.
 * Ex: /figurinha/42 → "Comprar figurinha 42 da Copa 2026 | Figu"
 *
 * Para ativar esta rota:
 * 1. Adicionar ao routeTree.gen.ts (ou habilitar TanStackRouterVite no build)
 * 2. Criar query Supabase para buscar vendedores com a figurinha
 * 3. Adicionar head() com meta title/description dinâmico por número
 *
 * Estrutura de URLs planejada:
 *   /figurinha/[numero]     — por número da figurinha
 *   /figurinha/[jogador]    — por nome do jogador (slug)
 *   /comprar/[figurinha]    — landing page de compra
 *   /vender/[figurinha]     — landing page de venda
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/figurinha/$numero")({
  component: FigurinhaPage,
});

function FigurinhaPage() {
  // Página em construção: noindex temporário até ter conteúdo real
  useEffect(() => {
    let el = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!el) { el = document.createElement("meta"); el.setAttribute("name", "robots"); document.head.appendChild(el); }
    el.setAttribute("content", "noindex, nofollow");
    return () => { el?.setAttribute("content", "index, follow"); };
  }, []);

  const { numero } = Route.useParams();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B1020",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
        padding: "2rem",
      }}
    >
      <div
        style={{
          height: "48px",
          width: "48px",
          borderRadius: "1rem",
          background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Sparkles style={{ height: "24px", width: "24px", color: "#fff" }} />
      </div>
      <h1
        style={{
          color: "#FFFFFF",
          fontWeight: 900,
          fontSize: "1.5rem",
          margin: 0,
          textAlign: "center",
        }}
      >
        Figurinha #{numero}
      </h1>
      <p style={{ color: "#A1A1AA", textAlign: "center", maxWidth: "400px" }}>
        Página de figurinha em construção. Em breve você poderá ver todos os
        vendedores que têm esta figurinha disponível.
      </p>
      <a
        href="/planos"
        style={{
          background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
          color: "#fff",
          fontWeight: 700,
          padding: "0.75rem 1.5rem",
          borderRadius: "0.875rem",
          textDecoration: "none",
          fontSize: "0.9375rem",
        }}
      >
        Ver planos
      </a>
    </div>
  );
}

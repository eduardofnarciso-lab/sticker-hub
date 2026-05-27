/**
 * ROTA SEO PROGRAMÁTICO: /comprar/:figurinha
 *
 * Objetivo futuro: Landing page de intenção de compra por figurinha/coleção.
 * Ex: /comprar/copa-2026-42 → "Comprar figurinha 42 Copa 2026 avulsa | Figu"
 *     /comprar/pikachu       → "Comprar figurinha Pikachu Pokémon | Figu"
 *
 * Alta intenção de compra = excelente para SEO e conversão.
 * O slug pode ser: [colecao]-[numero] ou [nome-jogador]
 *
 * Para ativar:
 * 1. Adicionar ao routeTree.gen.ts
 * 2. Parsear o slug para extrair coleção + número
 * 3. head() com title/description dinâmico + JSON-LD Product/Offer
 * 4. Listar vendedores disponíveis via Supabase
 */

import { createFileRoute } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/comprar/$figurinha")({
  component: ComprarPage,
});

function ComprarPage() {
  const { figurinha } = Route.useParams();
  const WHATSAPP = "5515991460543";

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
          background: "linear-gradient(135deg, #60A5FA, #22D3EE)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Search style={{ height: "24px", width: "24px", color: "#fff" }} />
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
        Comprar figurinha: {figurinha}
      </h1>
      <p style={{ color: "#A1A1AA", textAlign: "center", maxWidth: "400px" }}>
        Em breve você verá todos os vendedores com esta figurinha disponível para
        compra avulsa.
      </p>
      <a
        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
          `Olá! Quero comprar a figurinha: ${figurinha}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
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
        Encontrar figurinhas no WhatsApp
      </a>
    </div>
  );
}

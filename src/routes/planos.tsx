import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check, MessageCircle, Star, Bot, Zap, Sparkles, ChevronDown,
  Search, Package, Store, Trophy, RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/planos")({
  component: PlanosPage,
  head: () => ({
    meta: [
      { title: "Comprar e vender figurinhas avulsas | Figu" },
      {
        name: "description",
        content:
          "Compre, venda e encontre figurinhas avulsas para completar seu álbum sem gastar com pacotinhos repetidos. Marketplace de figurinhas Copa 2026.",
      },
      {
        name: "keywords",
        content:
          "comprar figurinhas avulsas, vender figurinhas repetidas, completar álbum, figurinhas copa 2026, comprar figurinhas online, marketplace de figurinhas, catálogo de figurinhas, álbum da copa, completar álbum sem repetidas",
      },
      { name: "robots", content: "index, follow" },
      // OpenGraph
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Comprar e vender figurinhas avulsas | Figu" },
      {
        property: "og:description",
        content:
          "Compre, venda e encontre figurinhas avulsas para completar seu álbum sem gastar com pacotinhos repetidos.",
      },
      { property: "og:url", content: "https://figu.spiritrelay.com/planos" },
      { property: "og:site_name", content: "Figu" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:image", content: "https://figu.spiritrelay.com/og.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Figu — Marketplace de figurinhas avulsas" },
      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Comprar e vender figurinhas avulsas | Figu" },
      {
        name: "twitter:description",
        content:
          "Compre, venda e encontre figurinhas avulsas para completar seu álbum sem gastar com pacotinhos repetidos.",
      },
      { name: "twitter:image", content: "https://figu.spiritrelay.com/og.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://figu.spiritrelay.com/planos" },
    ],
  }),
});

// ── Constantes ──────────────────────────────────────────────────────────────

const WHATSAPP = "5515991460543";
const WA_MSG   = encodeURIComponent("Olá! Quero saber mais sobre os planos para vender figurinhas na Figu.");
const WA_COMPRAR = encodeURIComponent("Olá! Quero encontrar figurinhas avulsas na Figu.");
const WA_VENDER  = encodeURIComponent("Olá! Quero vender minhas figurinhas repetidas na Figu.");

const RECURSOS_BASE = [
  "Catálogo público com link exclusivo",
  "Pedidos recebidos via WhatsApp",
  "Controle de estoque completo",
  "Reserva automática por 15 min",
  "Descontos por volume automáticos",
  "Dashboard de vendas",
  "Suporte via WhatsApp",
];

const planos = [
  {
    nome: "Starter",
    subtitulo: "Para completar seu álbum",
    preco: 20,
    limite: "até 500 figurinhas",
    accent: "#60A5FA",
    ctaText: "Começar agora",
  },
  {
    nome: "Pro",
    subtitulo: "Plano vendedor profissional",
    preco: 50,
    limite: "até 2.500 figurinhas",
    accent: "#8B5CF6",
    destaque: true,
    ctaText: "Completar meu álbum",
  },
  {
    nome: "Elite",
    subtitulo: "Colecionador premium",
    preco: 100,
    limite: "até 5.000 figurinhas",
    accent: "#22D3EE",
    ctaText: "Cadastrar meu estoque",
  },
];

const RECURSOS_ENTERPRISE = [
  "Figurinhas ilimitadas",
  "Envio automático de PIX via WhatsApp",
  "Verificação de estoque por mensagem",
  "Resposta automática para listas de figurinhas",
  "Notificação automática de novos pedidos",
  "Integração completa com n8n e Evolution API",
  "Automação de todo o fluxo de venda",
  "Múltiplos álbuns e coleções",
  "Relatórios avançados",
  "Configurações personalizadas",
  "Suporte VIP com atendimento dedicado",
  "Implantação e treinamento inclusos",
];

const BENEFICIOS = [
  {
    icon: Search,
    titulo: "Busca inteligente",
    descricao: "Encontre qualquer figurinha avulsa em segundos, sem precisar comprar pacotinhos inteiros.",
    color: "#60A5FA",
  },
  {
    icon: RefreshCw,
    titulo: "Venda suas repetidas",
    descricao: "Anuncie suas figurinhas repetidas e receba pedidos automaticamente via WhatsApp.",
    color: "#8B5CF6",
  },
  {
    icon: Package,
    titulo: "Estoque organizado",
    descricao: "Controle total de todas as suas figurinhas em uma plataforma dedicada para colecionadores.",
    color: "#22D3EE",
  },
  {
    icon: Store,
    titulo: "Marketplace especializado",
    descricao: "Plataforma criada especificamente para compra e venda de figurinhas avulsas no Brasil.",
    color: "#A78BFA",
  },
  {
    icon: Zap,
    titulo: "Pedidos automáticos",
    descricao: "Do pedido ao pagamento sem intervenção manual. Automatize todo o seu fluxo de vendas.",
    color: "#FCD34D",
  },
  {
    icon: Trophy,
    titulo: "Pokémon, TCG e mais",
    descricao: "Plataforma escalável para qualquer coleção: Copa, Pokémon, TCG, cards e muito mais.",
    color: "#34D399",
  },
];

const FAQ_ITEMS = [
  {
    pergunta: "Como comprar figurinhas avulsas pela Figu?",
    resposta:
      "Acesse o catálogo do vendedor pelo link compartilhado, escolha as figurinhas que precisa, informe seu nome e cidade, e finalize o pedido direto pelo WhatsApp. Simples, rápido e sem complicação.",
  },
  {
    pergunta: "Como vender minhas figurinhas repetidas?",
    resposta:
      "Crie sua conta na Figu, cadastre seu estoque de repetidas e compartilhe seu link de catálogo. Os compradores encontram suas figurinhas e fazem pedidos automaticamente via WhatsApp.",
  },
  {
    pergunta: "A Figu entrega para todo o Brasil?",
    resposta:
      "Sim! A Figu é uma plataforma online e os vendedores podem atender compradores de qualquer cidade do Brasil. O frete é combinado diretamente entre comprador e vendedor.",
  },
  {
    pergunta: "Como completar meu álbum mais rápido com a Figu?",
    resposta:
      "Com a Figu você encontra exatamente as figurinhas que faltam no seu álbum, sem precisar comprar pacotinhos inteiros. Compre apenas o que você precisa e complete sua coleção com muito mais eficiência.",
  },
  {
    pergunta: "Posso cadastrar meu próprio estoque de figurinhas?",
    resposta:
      "Sim! Com um dos nossos planos você pode cadastrar todo o seu estoque de figurinhas, organizar por número e álbum, e ter seu catálogo online pronto para receber pedidos.",
  },
  {
    pergunta: "Como funciona a busca de figurinhas na Figu?",
    resposta:
      "O catálogo da Figu exibe todas as figurinhas disponíveis com quantidade em estoque. O comprador navega, seleciona o que precisa e finaliza o pedido via WhatsApp em segundos.",
  },
];

// ── Componente principal ─────────────────────────────────────────────────────

function PlanosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // SEO: injeta title, meta tags e JSON-LD no <head> do documento
  useEffect(() => {
    document.title = "Comprar e vender figurinhas avulsas | Figu";

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Compre, venda e encontre figurinhas avulsas para completar seu álbum sem gastar com pacotinhos repetidos. Marketplace de figurinhas Copa 2026."
    );

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://figu.spiritrelay.com/planos");

    // JSON-LD: FAQPage Schema
    const removeScript = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
    removeScript("figu-faq-schema");
    removeScript("figu-webpage-schema");

    const faqScript = document.createElement("script");
    faqScript.id = "figu-faq-schema";
    faqScript.type = "application/ld+json";
    faqScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((q) => ({
        "@type": "Question",
        name: q.pergunta,
        acceptedAnswer: { "@type": "Answer", text: q.resposta },
      })),
    });
    document.head.appendChild(faqScript);

    // JSON-LD: WebPage Schema
    const webScript = document.createElement("script");
    webScript.id = "figu-webpage-schema";
    webScript.type = "application/ld+json";
    webScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Comprar e vender figurinhas avulsas | Figu",
      description:
        "Compre, venda e encontre figurinhas avulsas para completar seu álbum sem gastar com pacotinhos repetidos.",
      url: "https://figu.spiritrelay.com/planos",
      publisher: {
        "@type": "Organization",
        name: "Figu",
        url: "https://figu.spiritrelay.com",
      },
    });
    document.head.appendChild(webScript);

    return () => {
      removeScript("figu-faq-schema");
      removeScript("figu-webpage-schema");
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B1020",
        paddingBottom: "4rem",
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.15) 0%, transparent 60%)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        style={{
          background: "rgba(11,16,32,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: "1024px",
            margin: "0 auto",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              height: "36px",
              width: "36px",
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles style={{ height: "18px", width: "18px", color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#FFFFFF" }}>
              Figu
            </div>
            <div style={{ fontSize: "0.75rem", color: "#A1A1AA" }}>
              Marketplace de figurinhas avulsas
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              background: "rgba(34,211,238,0.15)",
              color: "#22D3EE",
              border: "1px solid rgba(34,211,238,0.25)",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.5rem 0.875rem",
              borderRadius: "0.625rem",
              textDecoration: "none",
            }}
          >
            <MessageCircle style={{ height: "14px", width: "14px" }} />
            Falar conosco
          </a>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1024px",
          margin: "0 auto",
          padding: "3rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "4rem",
        }}
      >
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          aria-label="Plataforma de figurinhas avulsas"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(139,92,246,0.12)",
              color: "#A78BFA",
              border: "1px solid rgba(139,92,246,0.2)",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.375rem 0.875rem",
              borderRadius: "999px",
            }}
          >
            <Star style={{ height: "14px", width: "14px" }} />
            Marketplace de figurinhas avulsas
          </div>

          <h1
            style={{
              fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: 0,
              maxWidth: "700px",
            }}
          >
            Complete seu álbum sem gastar com{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              pacotinhos repetidos.
            </span>
          </h1>

          <p
            style={{
              color: "#A1A1AA",
              maxWidth: "520px",
              fontSize: "1.0625rem",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Compre, venda e encontre{" "}
            <strong style={{ color: "#E4E4E7" }}>figurinhas avulsas</strong>{" "}
            rapidamente com a Figu.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
              marginTop: "0.25rem",
            }}
          >
            <a
              href={`https://wa.me/${WHATSAPP}?text=${WA_COMPRAR}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                color: "#fff",
                fontWeight: 700,
                padding: "0.875rem 1.5rem",
                borderRadius: "0.875rem",
                textDecoration: "none",
                fontSize: "0.9375rem",
                boxShadow: "0 0 24px rgba(139,92,246,0.4)",
              }}
            >
              <Search style={{ height: "18px", width: "18px" }} />
              Encontrar figurinhas
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${WA_VENDER}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255,255,255,0.06)",
                color: "#E4E4E7",
                fontWeight: 600,
                padding: "0.875rem 1.5rem",
                borderRadius: "0.875rem",
                textDecoration: "none",
                fontSize: "0.9375rem",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <RefreshCw style={{ height: "18px", width: "18px" }} />
              Vender repetidas
            </a>
          </div>

          <p style={{ color: "#52525B", fontSize: "0.75rem", margin: 0 }}>
            Planos a partir de{" "}
            <span style={{ color: "#A78BFA", fontWeight: 600 }}>R$20/mês</span>
            {" "}· Sem fidelidade · Cancele quando quiser
          </p>
        </section>

        {/* ── BENEFÍCIOS ───────────────────────────────────────── */}
        <section aria-label="Benefícios da plataforma Figu">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                fontWeight: 900,
                color: "#FFFFFF",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Por que usar a Figu?
            </h2>
            <p style={{ color: "#A1A1AA", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              A plataforma mais completa para{" "}
              <strong style={{ color: "#E4E4E7" }}>
                comprar e vender figurinhas avulsas
              </strong>{" "}
              no Brasil.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {BENEFICIOS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.titulo}
                  style={{
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    background: "rgba(21,27,46,0.5)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    gap: "1rem",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      height: "40px",
                      width: "40px",
                      borderRadius: "0.75rem",
                      background: `${b.color}18`,
                      border: `1px solid ${b.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ height: "20px", width: "20px", color: b.color }} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: "#FFFFFF",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {b.titulo}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "#A1A1AA",
                        lineHeight: 1.5,
                      }}
                    >
                      {b.descricao}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── PROVA SOCIAL ─────────────────────────────────────── */}
        <section aria-label="Números da plataforma Figu">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              { valor: "+10.000", label: "buscas realizadas", color: "#60A5FA" },
              { valor: "+50.000", label: "figurinhas cadastradas", color: "#8B5CF6" },
              { valor: "+1.000", label: "colecionadores ativos", color: "#22D3EE" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  borderRadius: "1rem",
                  padding: "1.5rem 1rem",
                  background: "rgba(21,27,46,0.5)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${stat.color}25`,
                  boxShadow: `0 0 28px ${stat.color}12`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    color: stat.color,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    textShadow: `0 0 20px ${stat.color}60`,
                  }}
                >
                  {stat.valor}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#A1A1AA" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLANOS ───────────────────────────────────────────── */}
        <section aria-label="Planos e preços">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                fontWeight: 900,
                color: "#FFFFFF",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Escolha seu plano
            </h2>
            <p style={{ color: "#A1A1AA", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              Todos incluem os mesmos recursos — só muda o limite de figurinhas.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {planos.map((plano) => (
              <div
                key={plano.nome}
                style={{
                  position: "relative",
                  borderRadius: "1.25rem",
                  padding: "1.5rem",
                  background: plano.destaque
                    ? "rgba(139,92,246,0.1)"
                    : "rgba(21,27,46,0.6)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${
                    plano.destaque
                      ? "rgba(139,92,246,0.3)"
                      : "rgba(255,255,255,0.07)"
                  }`,
                  boxShadow: plano.destaque
                    ? "0 0 32px rgba(139,92,246,0.15)"
                    : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  transform: plano.destaque ? "scale(1.02)" : "scale(1)",
                }}
              >
                {plano.destaque && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <span
                      style={{
                        background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                        color: "#fff",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.25rem 0.875rem",
                        borderRadius: "999px",
                        boxShadow: "0 0 16px rgba(139,92,246,0.4)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⭐ Mais popular
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{ fontWeight: 700, fontSize: "1.25rem", color: "#FFFFFF" }}
                    >
                      {plano.nome}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.5rem",
                        borderRadius: "999px",
                        background: `${plano.accent}18`,
                        color: plano.accent,
                        border: `1px solid ${plano.accent}33`,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {plano.limite}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#71717A" }}>
                    {plano.subtitulo}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: "0.25rem" }}>
                  <span
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 900,
                      color: "#FFFFFF",
                      lineHeight: 1,
                    }}
                  >
                    R${plano.preco}
                  </span>
                  <span
                    style={{
                      color: "#71717A",
                      fontSize: "0.875rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    /mês
                  </span>
                </div>

                <ul
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.625rem",
                    flex: 1,
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                  }}
                >
                  {RECURSOS_BASE.map((r) => (
                    <li
                      key={r}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <Check
                        style={{
                          height: "16px",
                          width: "16px",
                          color: plano.accent,
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      />
                      <span style={{ color: "#D4D4D8" }}>{r}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                    `Olá! Quero contratar o plano ${plano.nome} (R$${plano.preco}/mês) da Figu.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    color: "#fff",
                    fontWeight: 700,
                    padding: "0.875rem",
                    borderRadius: "0.875rem",
                    background: `linear-gradient(135deg, ${plano.accent}, ${
                      plano.destaque ? "#60A5FA" : plano.accent + "cc"
                    })`,
                    textDecoration: "none",
                    boxShadow: `0 0 20px ${plano.accent}33`,
                  }}
                >
                  <MessageCircle style={{ height: "16px", width: "16px" }} />
                  {plano.ctaText}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── ENTERPRISE ───────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            borderRadius: "1.5rem",
            overflow: "hidden",
            background: "rgba(21,27,46,0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 0 60px rgba(139,92,246,0.1)",
            padding: "2.5rem",
          }}
        >
          {/* Glow decorativo */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-64px",
                right: "-64px",
                width: "256px",
                height: "256px",
                background: "rgba(139,92,246,0.12)",
                borderRadius: "50%",
                filter: "blur(60px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-64px",
                left: "-64px",
                width: "192px",
                height: "192px",
                background: "rgba(96,165,250,0.1)",
                borderRadius: "50%",
                filter: "blur(60px)",
              }}
            />
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2.5rem",
            }}
          >
            {/* Lado esquerdo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(139,92,246,0.15)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    color: "#A78BFA",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.375rem 0.75rem",
                    borderRadius: "999px",
                    width: "fit-content",
                  }}
                >
                  <Zap style={{ height: "14px", width: "14px" }} />
                  Automação completa
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Bot style={{ height: "32px", width: "32px", color: "#A78BFA" }} />
                  <h2
                    style={{
                      fontSize: "1.875rem",
                      fontWeight: 900,
                      color: "#FFFFFF",
                      margin: 0,
                    }}
                  >
                    Enterprise
                  </h2>
                </div>
                <p style={{ color: "#A1A1AA", fontSize: "0.875rem", margin: 0 }}>
                  Para quem vende em alto volume e quer o fluxo 100% automatizado — do
                  pedido ao PIX, sem intervenção manual.
                </p>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "0.25rem" }}>
                  <span
                    style={{
                      fontSize: "3rem",
                      fontWeight: 900,
                      color: "#FFFFFF",
                      lineHeight: 1,
                    }}
                  >
                    R$1.000
                  </span>
                  <span
                    style={{
                      color: "#71717A",
                      fontSize: "0.875rem",
                      marginBottom: "0.375rem",
                    }}
                  >
                    /mês
                  </span>
                </div>
                <div style={{ color: "#71717A", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  Figurinhas ilimitadas · Implantação inclusa
                </div>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                  "Olá! Tenho interesse no plano Enterprise da Figu. Quero saber mais sobre a automação completa."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                  color: "#fff",
                  fontWeight: 700,
                  padding: "0.875rem 1.5rem",
                  borderRadius: "0.875rem",
                  textDecoration: "none",
                  width: "fit-content",
                  boxShadow: "0 0 24px rgba(139,92,246,0.4)",
                }}
              >
                <MessageCircle style={{ height: "16px", width: "16px" }} />
                Falar com especialista
              </a>
            </div>

            {/* Recursos Enterprise */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p
                style={{
                  color: "#71717A",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                }}
              >
                O que está incluído
              </p>
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                }}
              >
                {RECURSOS_ENTERPRISE.map((r) => (
                  <li
                    key={r}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.625rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <div
                      style={{
                        height: "20px",
                        width: "20px",
                        borderRadius: "50%",
                        background: "rgba(139,92,246,0.15)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      <Check
                        style={{ height: "12px", width: "12px", color: "#A78BFA" }}
                      />
                    </div>
                    <span style={{ color: "#D4D4D8" }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section aria-label="Perguntas frequentes sobre figurinhas avulsas">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                fontWeight: 900,
                color: "#FFFFFF",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Perguntas frequentes
            </h2>
            <p style={{ color: "#A1A1AA", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              Tudo sobre comprar e vender figurinhas avulsas na Figu.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
                style={{
                  borderRadius: "0.875rem",
                  background:
                    openFaq === idx ? "rgba(139,92,246,0.08)" : "rgba(21,27,46,0.5)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${
                    openFaq === idx
                      ? "rgba(139,92,246,0.25)"
                      : "rgba(255,255,255,0.07)"
                  }`,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  aria-expanded={openFaq === idx}
                >
                  <span
                    itemProp="name"
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "#E4E4E7",
                    }}
                  >
                    {item.pergunta}
                  </span>
                  <ChevronDown
                    style={{
                      height: "18px",
                      width: "18px",
                      color: "#A78BFA",
                      flexShrink: 0,
                      transform:
                        openFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>

                {openFaq === idx && (
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                    style={{ padding: "0 1.25rem 1rem" }}
                  >
                    <p
                      itemProp="text"
                      style={{
                        fontSize: "0.875rem",
                        color: "#A1A1AA",
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {item.resposta}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ────────────────────────────────────────── */}
        <section
          aria-label="Comece a usar a Figu agora"
          style={{
            borderRadius: "1.5rem",
            padding: "2.5rem",
            textAlign: "center",
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.25rem, 3vw, 1.625rem)",
              fontWeight: 900,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Pronto para completar seu álbum?
          </h2>
          <p
            style={{
              color: "#A1A1AA",
              fontSize: "0.875rem",
              maxWidth: "400px",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Entre em contato agora e comece a comprar ou vender figurinhas
            avulsas hoje mesmo.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <a
              href={`https://wa.me/${WHATSAPP}?text=${WA_COMPRAR}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                color: "#fff",
                fontWeight: 700,
                padding: "0.875rem 1.75rem",
                borderRadius: "0.875rem",
                textDecoration: "none",
                fontSize: "0.9375rem",
                boxShadow: "0 0 24px rgba(139,92,246,0.35)",
              }}
            >
              <MessageCircle style={{ height: "20px", width: "20px" }} />
              Começar agora
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${WA_VENDER}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255,255,255,0.06)",
                color: "#E4E4E7",
                fontWeight: 600,
                padding: "0.875rem 1.75rem",
                borderRadius: "0.875rem",
                textDecoration: "none",
                fontSize: "0.9375rem",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <RefreshCw style={{ height: "20px", width: "20px" }} />
              Vender repetidas
            </a>
          </div>
        </section>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(11,16,32,0.9)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "0.5rem 1rem",
          textAlign: "center",
          fontSize: "0.625rem",
          color: "#52525B",
          zIndex: 10,
        }}
      >
        Desenvolvido por{" "}
        <a
          href="https://spiritrelay.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#A78BFA", textDecoration: "none" }}
        >
          SpiritRelay
        </a>{" "}
        · Marketplace de Figurinhas Avulsas
      </footer>
    </div>
  );
}
                color: "#fff",
                fontWeight: 700,
                padding: "0.875rem 1.75rem",
                borderRadius: "0.875rem",
                textDecoration: "none",
                fontSize: "0.9375rem",
                boxShadow: "0 0 24px rgba(139,92,246,0.35)",
              }}
            >
              <MessageCircle style={{ height: "20px", width: "20px" }} />
              Começar agora
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${WA_VENDER}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255,255,255,0.06)",
                color: "#E4E4E7",
                fontWeight: 600,
                padding: "0.875rem 1.75rem",
                borderRadius: "0.875rem",
                textDecoration: "none",
                fontSize: "0.9375rem",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <RefreshCw style={{ height: "20px", width: "20px" }} />
              Vender repetidas
            </a>
          </div>
        </section>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(11,16,32,0.9)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "0.5rem 1rem",
          textAlign: "center",
          fontSize: "0.625rem",
          color: "#52525B",
          zIndex: 10,
        }}
      >
        Desenvolvido por{" "}
        <a
          href="https://spiritrelay.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#A78BFA", textDecoration: "none" }}
        >
          SpiritRelay
        </a>{" "}
        · Marketplace de Figurinhas Avulsas
      </footer>
    </div>
  );
}

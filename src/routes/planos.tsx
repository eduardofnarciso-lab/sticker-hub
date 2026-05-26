import { createFileRoute } from "@tanstack/react-router";
import { Check, MessageCircle, Sticker, Star, Bot, Zap, Sparkles } from "lucide-react";

export const Route = createFileRoute("/planos")({
  component: PlanosPage,
  head: () => ({
    meta: [
      { title: "Planos — Figu · SpiritRelay" },
      { name: "description", content: "Venda suas figurinhas online com facilidade. Planos a partir de R$20/mês." },
    ],
  }),
});

const WHATSAPP = "5515991460543";
const WA_MSG   = encodeURIComponent("Olá! Quero saber mais sobre os planos para vender figurinhas na plataforma SpiritRelay.");

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
  { nome: "Starter", preco: 20,  limite: "até 500 figurinhas",   accent: "#60A5FA" },
  { nome: "Pro",     preco: 50,  limite: "até 2.500 figurinhas", accent: "#8B5CF6", destaque: true },
  { nome: "Elite",   preco: 100, limite: "até 5.000 figurinhas", accent: "#22D3EE" },
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

function PlanosPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0B1020", paddingBottom: "4rem",
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.15) 0%, transparent 60%)" }}>

      {/* Header */}
      <header style={{
        background: "rgba(11,16,32,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "0.75rem 1rem",
          display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            height: "36px", width: "36px", borderRadius: "0.75rem",
            background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Sparkles style={{ height: "18px", width: "18px", color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#FFFFFF" }}>Figu · SpiritRelay</div>
            <div style={{ fontSize: "0.75rem", color: "#A1A1AA" }}>Plataforma de figurinhas</div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              background: "rgba(34,211,238,0.15)", color: "#22D3EE",
              border: "1px solid rgba(34,211,238,0.25)",
              fontSize: "0.75rem", fontWeight: 600,
              padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
              textDecoration: "none",
            }}
          >
            <MessageCircle style={{ height: "14px", width: "14px" }} />
            Falar conosco
          </a>
        </div>
      </header>

      <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "3rem 1rem", display: "flex", flexDirection: "column", gap: "3.5rem" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(139,92,246,0.12)", color: "#A78BFA",
            border: "1px solid rgba(139,92,246,0.2)",
            fontSize: "0.75rem", fontWeight: 600,
            padding: "0.375rem 0.875rem", borderRadius: "999px",
          }}>
            <Star style={{ height: "14px", width: "14px" }} />
            Plataforma especializada em figurinhas
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)", fontWeight: 900, color: "#FFFFFF",
            letterSpacing: "-0.02em", lineHeight: 1.15, margin: 0 }}>
            Venda suas figurinhas<br />
            <span style={{ background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              de forma profissional
            </span>
          </h1>
          <p style={{ color: "#A1A1AA", maxWidth: "520px", fontSize: "1rem", margin: 0 }}>
            Catálogo online, pedidos via WhatsApp e controle de estoque completo.
            Planos a partir de <strong style={{ color: "#E4E4E7" }}>R$20/mês</strong>.
          </p>
        </div>

        {/* Planos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#FFFFFF", margin: 0 }}>Planos</h2>
            <p style={{ color: "#A1A1AA", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Todos incluem os mesmos recursos — só muda o limite de figurinhas.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
            {planos.map((plano) => (
              <div key={plano.nome}
                style={{
                  position: "relative",
                  borderRadius: "1.25rem",
                  padding: "1.5rem",
                  background: plano.destaque ? "rgba(139,92,246,0.1)" : "rgba(21,27,46,0.6)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${plano.destaque ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: plano.destaque ? "0 0 32px rgba(139,92,246,0.15)" : "none",
                  display: "flex", flexDirection: "column", gap: "1.25rem",
                  transform: plano.destaque ? "scale(1.02)" : "scale(1)",
                }}
              >
                {plano.destaque && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)" }}>
                    <span style={{
                      background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                      color: "#fff", fontSize: "0.6875rem", fontWeight: 700,
                      padding: "0.25rem 0.875rem", borderRadius: "999px",
                      boxShadow: "0 0 16px rgba(139,92,246,0.4)",
                    }}>
                      ⭐ Mais popular
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.25rem", color: "#FFFFFF" }}>{plano.nome}</div>
                  <div style={{
                    display: "inline-flex", fontSize: "0.75rem", fontWeight: 600,
                    padding: "0.2rem 0.625rem", borderRadius: "999px", width: "fit-content",
                    background: `${plano.accent}18`, color: plano.accent,
                    border: `1px solid ${plano.accent}33`,
                  }}>
                    {plano.limite}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: "0.25rem" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                    R${plano.preco}
                  </span>
                  <span style={{ color: "#71717A", fontSize: "0.875rem", marginBottom: "0.25rem" }}>/mês</span>
                </div>

                <ul style={{ display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1, margin: 0, padding: 0, listStyle: "none" }}>
                  {RECURSOS_BASE.map((r) => (
                    <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem" }}>
                      <Check style={{ height: "16px", width: "16px", color: plano.accent, flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ color: "#D4D4D8" }}>{r}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                    `Olá! Quero contratar o plano ${plano.nome} (R$${plano.preco}/mês) da SpiritRelay.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    color: "#fff", fontWeight: 700, padding: "0.875rem", borderRadius: "0.875rem",
                    background: `linear-gradient(135deg, ${plano.accent}, ${plano.destaque ? "#60A5FA" : plano.accent}cc)`,
                    textDecoration: "none",
                    boxShadow: `0 0 20px ${plano.accent}33`,
                  }}
                >
                  <MessageCircle style={{ height: "16px", width: "16px" }} />
                  Quero este plano
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise */}
        <div style={{
          position: "relative", borderRadius: "1.5rem", overflow: "hidden",
          background: "rgba(21,27,46,0.8)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(139,92,246,0.2)",
          boxShadow: "0 0 60px rgba(139,92,246,0.1)",
          padding: "2.5rem",
        }}>
          {/* Glow decorativo */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-64px", right: "-64px", width: "256px", height: "256px",
              background: "rgba(139,92,246,0.12)", borderRadius: "50%", filter: "blur(60px)" }} />
            <div style={{ position: "absolute", bottom: "-64px", left: "-64px", width: "192px", height: "192px",
              background: "rgba(96,165,250,0.1)", borderRadius: "50%", filter: "blur(60px)" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1, display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2.5rem" }}>
            {/* Lado esquerdo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)",
                  color: "#A78BFA", fontSize: "0.75rem", fontWeight: 700,
                  padding: "0.375rem 0.75rem", borderRadius: "999px", width: "fit-content",
                }}>
                  <Zap style={{ height: "14px", width: "14px" }} />
                  Automação completa
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Bot style={{ height: "32px", width: "32px", color: "#A78BFA" }} />
                  <h2 style={{ fontSize: "1.875rem", fontWeight: 900, color: "#FFFFFF", margin: 0 }}>Enterprise</h2>
                </div>
                <p style={{ color: "#A1A1AA", fontSize: "0.875rem", margin: 0 }}>
                  Para quem vende em alto volume e quer o fluxo 100% automatizado — do pedido ao PIX, sem intervenção manual.
                </p>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "0.25rem" }}>
                  <span style={{ fontSize: "3rem", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>R$1.000</span>
                  <span style={{ color: "#71717A", fontSize: "0.875rem", marginBottom: "0.375rem" }}>/mês</span>
                </div>
                <div style={{ color: "#71717A", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  Figurinhas ilimitadas · Implantação inclusa
                </div>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                  "Olá! Tenho interesse no plano Enterprise da SpiritRelay. Quero saber mais sobre a automação completa."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                  color: "#fff", fontWeight: 700,
                  padding: "0.875rem 1.5rem", borderRadius: "0.875rem",
                  textDecoration: "none", width: "fit-content",
                  boxShadow: "0 0 24px rgba(139,92,246,0.4)",
                }}
              >
                <MessageCircle style={{ height: "16px", width: "16px" }} />
                Falar com especialista
              </a>
            </div>

            {/* Recursos */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ color: "#71717A", fontSize: "0.75rem", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                O que está incluído
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.625rem", margin: 0, padding: 0, listStyle: "none" }}>
                {RECURSOS_ENTERPRISE.map((r) => (
                  <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.875rem" }}>
                    <div style={{
                      height: "20px", width: "20px", borderRadius: "50%",
                      background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px",
                    }}>
                      <Check style={{ height: "12px", width: "12px", color: "#A78BFA" }} />
                    </div>
                    <span style={{ color: "#D4D4D8" }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div style={{
          borderRadius: "1.5rem", padding: "2.5rem", textAlign: "center",
          background: "rgba(139,92,246,0.12)",
          border: "1px solid rgba(139,92,246,0.2)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#FFFFFF", margin: 0 }}>Pronto para começar?</h2>
          <p style={{ color: "#A1A1AA", fontSize: "0.875rem", maxWidth: "400px", margin: 0 }}>
            Entre em contato agora e tenha sua loja de figurinhas funcionando hoje mesmo.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
              color: "#fff", fontWeight: 700,
              padding: "0.875rem 1.75rem", borderRadius: "0.875rem",
              textDecoration: "none", fontSize: "0.9375rem",
              boxShadow: "0 0 24px rgba(139,92,246,0.35)",
            }}
          >
            <MessageCircle style={{ height: "20px", width: "20px" }} />
            Falar com a SpiritRelay no WhatsApp
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(11,16,32,0.9)", backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "0.5rem 1rem", textAlign: "center",
        fontSize: "0.625rem", color: "#52525B", zIndex: 10,
      }}>
        Desenvolvido por{" "}
        <a href="https://spiritrelay.com/" target="_blank" rel="noopener noreferrer"
          style={{ color: "#A78BFA", textDecoration: "none" }}>
          SpiritRelay
        </a>
        {" "}· Plataforma de Figurinhas
      </footer>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Check, MessageCircle, Sticker, Star, Bot, Zap } from "lucide-react";

export const Route = createFileRoute("/planos")({
  component: PlanosPage,
  head: () => ({
    meta: [
      { title: "Planos — SpiritRelay Figurinhas" },
      { name: "description", content: "Venda suas figurinhas online com facilidade. Planos a partir de R$20/mês." },
    ],
  }),
});

const WHATSAPP = "5515991460543";
const WA_MSG   = encodeURIComponent("Olá! Quero saber mais sobre os planos para vender figurinhas na plataforma SpiritRelay.");

// Recursos comuns a todos os planos simples
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
  { nome: "Starter", preco: 20,  limite: "até 500 figurinhas",   color: "blue"  },
  { nome: "Pro",     preco: 50,  limite: "até 2.500 figurinhas", color: "green", destaque: true },
  { nome: "Elite",   preco: 100, limite: "até 5.000 figurinhas", color: "amber" },
];

const colorMap: Record<string, { bg: string; border: string; badge: string; btn: string; check: string }> = {
  blue:  { bg: "bg-blue-50",   border: "border-blue-200",  badge: "bg-blue-100 text-blue-700",   btn: "bg-blue-600 hover:bg-blue-700",   check: "text-blue-600"  },
  green: { bg: "bg-green-50",  border: "border-green-300", badge: "bg-green-600 text-white",      btn: "bg-green-600 hover:bg-green-700", check: "text-green-600" },
  amber: { bg: "bg-amber-50",  border: "border-amber-200", badge: "bg-amber-100 text-amber-700",  btn: "bg-amber-500 hover:bg-amber-600", check: "text-amber-600" },
};

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16">

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
            <Sticker className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">SpiritRelay — Figurinhas</div>
            <div className="text-xs text-muted-foreground">Plataforma de venda de figurinhas</div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Falar conosco
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Star className="h-3.5 w-3.5" />
            Plataforma especializada em figurinhas
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Venda suas figurinhas<br />
            <span className="text-green-600">de forma profissional</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Catálogo online, pedidos via WhatsApp e controle de estoque completo.
            Planos a partir de <strong>R$20/mês</strong>.
          </p>
        </div>

        {/* Planos simples — grid 3 colunas */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-black">Planos</h2>
            <p className="text-muted-foreground text-sm mt-1">Todos os planos incluem os mesmos recursos — só muda o limite de figurinhas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {planos.map((plano) => {
              const c = colorMap[plano.color];
              return (
                <div
                  key={plano.nome}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col gap-5 shadow-sm ${c.bg} ${c.border} ${
                    plano.destaque ? "shadow-lg scale-[1.02]" : ""
                  }`}
                >
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                        ⭐ Mais popular
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="font-bold text-xl">{plano.nome}</div>
                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${c.badge}`}>
                      {plano.limite}
                    </div>
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">R${plano.preco}</span>
                    <span className="text-muted-foreground text-sm mb-1">/mês</span>
                  </div>

                  <ul className="space-y-2 flex-1">
                    {RECURSOS_BASE.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${c.check}`} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                      `Olá! Quero contratar o plano ${plano.nome} (R$${plano.preco}/mês) da SpiritRelay.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-colors ${c.btn}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Quero este plano
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plano Enterprise — card especial full width */}
        <div className="relative rounded-3xl border-2 border-slate-800 bg-slate-900 text-white p-8 md:p-10 shadow-2xl overflow-hidden">
          {/* Fundo decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          </div>

          <div className="relative z-10 grid md:grid-cols-2 gap-10">
            {/* Lado esquerdo */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-full">
                  <Zap className="h-3.5 w-3.5" />
                  Automação completa
                </div>
                <div className="flex items-center gap-3">
                  <Bot className="h-8 w-8 text-purple-400" />
                  <h2 className="text-3xl font-black">Enterprise</h2>
                </div>
                <p className="text-slate-400 text-sm">
                  Para quem vende em alto volume e quer o fluxo 100% automatizado — do pedido ao PIX, sem intervenção manual.
                </p>
              </div>

              <div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black">R$1.000</span>
                  <span className="text-slate-400 text-sm mb-1.5">/mês</span>
                </div>
                <div className="text-slate-400 text-xs mt-1">Figurinhas ilimitadas · Implantação inclusa</div>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                  "Olá! Tenho interesse no plano Enterprise da SpiritRelay. Quero saber mais sobre a automação completa."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3.5 rounded-xl hover:bg-slate-100 transition-colors shadow-lg text-sm"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                Falar com especialista
              </a>
            </div>

            {/* Lado direito — recursos */}
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">O que está incluído</p>
              <ul className="space-y-2.5">
                {RECURSOS_ENTERPRISE.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-purple-400" />
                    </div>
                    <span className="text-slate-200">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div className="bg-green-600 rounded-2xl p-8 text-center text-white space-y-4">
          <h2 className="text-2xl font-black">Pronto para começar?</h2>
          <p className="text-green-100 text-sm max-w-md mx-auto">
            Entre em contato agora e tenha sua loja de figurinhas funcionando hoje mesmo.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors shadow"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com a SpiritRelay no WhatsApp
          </a>
        </div>
      </div>

      {/* Footer fixo */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur border-t py-2 text-center text-[10px] text-muted-foreground/50 z-10">
        Desenvolvido por <span className="font-semibold">SpiritRelay</span> · Empresa de Desenvolvimento
      </footer>
    </div>
  );
}

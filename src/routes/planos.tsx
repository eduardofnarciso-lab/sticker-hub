import { createFileRoute } from "@tanstack/react-router";
import { Check, MessageCircle, Sticker, Zap, Star, Trophy } from "lucide-react";

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
const WA_MSG  = encodeURIComponent("Olá! Quero saber mais sobre os planos para vender figurinhas na plataforma SpiritRelay.");

const planos = [
  {
    id:    "starter",
    nome:  "Starter",
    preco: 20,
    limite: "até 500 figurinhas",
    icon:  Sticker,
    color: "blue",
    destaque: false,
    recursos: [
      "Catálogo público com link exclusivo",
      "Pedidos via WhatsApp",
      "Controle de estoque",
      "Reserva automática por 15 min",
      "Suporte via WhatsApp",
    ],
  },
  {
    id:    "pro",
    nome:  "Pro",
    preco: 50,
    limite: "até 2.500 figurinhas",
    icon:  Zap,
    color: "green",
    destaque: true,
    recursos: [
      "Tudo do Starter",
      "Notificações automáticas via WhatsApp",
      "Verificação de estoque por mensagem",
      "Descontos por volume configuráveis",
      "Relatórios de vendas",
      "Suporte prioritário",
    ],
  },
  {
    id:    "elite",
    nome:  "Elite",
    preco: 100,
    limite: "5.000+ figurinhas",
    icon:  Trophy,
    color: "amber",
    destaque: false,
    recursos: [
      "Tudo do Pro",
      "Múltiplos álbuns",
      "Integração com n8n/automações",
      "Dashboard avançado",
      "Suporte VIP",
      "Configurações personalizadas",
    ],
  },
];

const colorMap: Record<string, {
  bg: string; border: string; badge: string; btn: string; icon: string; check: string;
}> = {
  blue: {
    bg:     "bg-blue-50",
    border: "border-blue-200",
    badge:  "bg-blue-100 text-blue-700",
    btn:    "bg-blue-600 hover:bg-blue-700",
    icon:   "text-blue-500",
    check:  "text-blue-600",
  },
  green: {
    bg:     "bg-green-50",
    border: "border-green-300",
    badge:  "bg-green-600 text-white",
    btn:    "bg-green-600 hover:bg-green-700",
    icon:   "text-green-500",
    check:  "text-green-600",
  },
  amber: {
    bg:     "bg-amber-50",
    border: "border-amber-200",
    badge:  "bg-amber-100 text-amber-700",
    btn:    "bg-amber-500 hover:bg-amber-600",
    icon:   "text-amber-500",
    check:  "text-amber-600",
  },
};

function PlanosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

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

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">

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
            Catálogo online, pedidos via WhatsApp, controle de estoque e notificações automáticas.
            Tudo em um só lugar, a partir de <strong>R$20/mês</strong>.
          </p>
        </div>

        {/* Tabela de descontos por volume */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold">Descontos automáticos por volume</h2>
            <p className="text-sm text-muted-foreground mt-1">Quanto mais figurinhas no pedido, maior o desconto aplicado automaticamente</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold text-muted-foreground">Quantidade no pedido</th>
                  <th className="text-center py-2 font-semibold text-muted-foreground">Figurinha normal</th>
                  <th className="text-center py-2 font-semibold text-muted-foreground">Figurinha brilhante</th>
                  <th className="text-center py-2 font-semibold text-muted-foreground">Desconto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2.5 text-muted-foreground">1 – 149 figurinhas</td>
                  <td className="py-2.5 text-center font-medium">R$ 1,00</td>
                  <td className="py-2.5 text-center font-medium">R$ 2,00</td>
                  <td className="py-2.5 text-center text-muted-foreground">—</td>
                </tr>
                <tr className="bg-blue-50/50">
                  <td className="py-2.5 font-medium">150 – 249 figurinhas</td>
                  <td className="py-2.5 text-center font-bold text-blue-700">R$ 0,95</td>
                  <td className="py-2.5 text-center font-bold text-blue-700">R$ 1,95</td>
                  <td className="py-2.5 text-center"><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">5% off</span></td>
                </tr>
                <tr className="bg-green-50/50">
                  <td className="py-2.5 font-medium">250 – 499 figurinhas</td>
                  <td className="py-2.5 text-center font-bold text-green-700">R$ 0,90</td>
                  <td className="py-2.5 text-center font-bold text-green-700">R$ 1,90</td>
                  <td className="py-2.5 text-center"><span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">10% off</span></td>
                </tr>
                <tr className="bg-amber-50/50">
                  <td className="py-2.5 font-medium">500+ figurinhas</td>
                  <td className="py-2.5 text-center font-bold text-amber-700">R$ 0,85</td>
                  <td className="py-2.5 text-center font-bold text-amber-700">R$ 1,85</td>
                  <td className="py-2.5 text-center"><span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">15% off</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Planos */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-black">Escolha seu plano</h2>
            <p className="text-muted-foreground text-sm mt-1">Sem fidelidade. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {planos.map((plano) => {
              const c   = colorMap[plano.color];
              const Icon = plano.icon;
              return (
                <div
                  key={plano.id}
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
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${c.icon}`} />
                      <span className="font-bold text-lg">{plano.nome}</span>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${c.badge}`}>
                      {plano.limite}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black">R${plano.preco}</span>
                      <span className="text-muted-foreground text-sm mb-1">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-2 flex-1">
                    {plano.recursos.map((r) => (
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
      <div className="h-10" /> {/* espaço para o footer não cobrir conteúdo */}
    </div>
  );
}

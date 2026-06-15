import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package, Clock, Trophy, BadgeDollarSign,
  Sticker, PackageSearch, Receipt, ScanLine, TrendingUp, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getAllTemplates } from "@/lib/copa2026Data";
import { toast } from "sonner";

const VALID_CODES = new Set(getAllTemplates().map((t) => t.code));

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function stickerPrice(code: string | null): number {
  if (!code) return 1;
  if (code === "00" || code.startsWith("FWC")) return 2;
  if (/^[A-Z]{2,3}1$/.test(code)) return 2;
  return 1;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: stickers } = await supabase
        .from("stickers")
        .select("code, quantity, price, status")
        .eq("user_id", user!.id);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, total_value")
        .eq("user_id", user!.id);

      const list = stickers ?? [];
      const comEstoque = list.filter((s) => (s.quantity ?? 0) > 0);

      const isEscudo = (code: string | null) =>
        !!code && (code === "00" || code.startsWith("FWC") || /^[A-Z]{2,3}1$/.test(code));
      const isFoto13 = (code: string | null) =>
        !!code && /^[A-Z]{2,3}13$/.test(code);
      const isExtra  = (code: string | null) => !!code && code.startsWith("EX");

      const getPrice = (s: typeof comEstoque[0]) => s.price ? Number(s.price) : stickerPrice(s.code);

      // ── Figurinhas Copa (sem extras) ───────────────────────────────────────
      const copaList  = comEstoque.filter((s) => !isExtra(s.code));
      const normais   = copaList.filter((s) => !isEscudo(s.code) && !isFoto13(s.code)).reduce((a, s) => a + s.quantity, 0);
      const especiais = copaList.filter((s) => isEscudo(s.code)).reduce((a, s) => a + s.quantity, 0);
      const fotos13   = copaList.filter((s) => isFoto13(s.code)).reduce((a, s) => a + s.quantity, 0);
      const totalEmEstoque  = normais + especiais + fotos13;
      const valorEstimado   = copaList.reduce((acc, s) => acc + getPrice(s) * s.quantity, 0);

      // ── Extras ─────────────────────────────────────────────────────────────
      const extrasList       = comEstoque.filter((s) => isExtra(s.code));
      const extrasUnidades   = extrasList.reduce((a, s) => a + s.quantity, 0);
      const extrasValorEstoque = extrasList.reduce((acc, s) => acc + getPrice(s) * s.quantity, 0);

      // ── Vendas ─────────────────────────────────────────────────────────────
      const ordersData    = orders ?? [];
      const valorPendente = ordersData.filter((o) => o.status === "pendente").reduce((acc, o) => acc + Number(o.total_value), 0);
      const qtdPendentes  = ordersData.filter((o) => o.status === "pendente").length;

      const approvedIds = ordersData
        .filter((o) => ["aprovado", "separado", "entregue"].includes(o.status))
        .map((o) => o.id);

      // Total vendido (base segura via orders.total_value)
      const totalVendido = ordersData
        .filter((o) => ["aprovado", "separado", "entregue"].includes(o.status))
        .reduce((acc, o) => acc + Number(o.total_value), 0);

      // Por padrão, tudo é Copa; tenta separar via order_items
      let copaVendido   = totalVendido;
      let extrasVendido = 0;

      if (approvedIds.length > 0) {
        const { data: items, error: itemsErr } = await (supabase as any)
          .from("order_items")
          .select("sticker_code, quantity, unit_price")
          .in("order_id", approvedIds);

        if (!itemsErr && items && items.length > 0) {
          let extraCalc = 0;
          let copaCalc  = 0;
          for (const item of items) {
            const val = Number(item.unit_price) * Number(item.quantity);
            if (item.sticker_code?.startsWith("EX")) extraCalc += val;
            else copaCalc += val;
          }
          extrasVendido = extraCalc;
          // Se order_items não cobre pedidos antigos, usa total como base
          copaVendido = (copaCalc + extraCalc) < totalVendido * 0.9
            ? totalVendido - extraCalc
            : copaCalc;
        }
      }

      return {
        // Copa
        valorEstimado, totalEmEstoque, copaVendido,
        normais, especiais, fotos13,
        // Extras
        extrasUnidades, extrasValorEstoque, extrasVendido,
        // Geral
        valorPendente, qtdPendentes,
      };
    },
  });

  const sharePublic = async () => {
    const url = `${window.location.origin}/public-catalog/${user?.id ?? ""}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link do catálogo copiado!");
    } catch {
      toast.info(url);
    }
  };

  const CARDS_COPA = [
    { label: "Valor em Estoque", value: brl(data?.valorEstimado ?? 0), sub: `${data?.totalEmEstoque ?? 0} figurinhas Copa`, icon: Package, gradient: "linear-gradient(135deg,#8B5CF6,#60A5FA)", glow: "rgba(139,92,246,0.3)" },
    { label: "Total Vendido", value: brl(data?.copaVendido ?? 0), sub: "aprovados + separados + entregues", icon: BadgeDollarSign, gradient: "linear-gradient(135deg,#22D3EE,#34D399)", glow: "rgba(34,211,238,0.3)" },
    { label: "Pendente", value: brl(data?.valorPendente ?? 0), sub: `${data?.qtdPendentes ?? 0} pedido${(data?.qtdPendentes ?? 0) !== 1 ? "s" : ""} aguardando`, icon: Clock, gradient: "linear-gradient(135deg,#F59E0B,#EF4444)", glow: "rgba(245,158,11,0.3)" },
    { label: "Normais", value: data?.normais ?? 0, sub: "jogadores", icon: TrendingUp, gradient: "linear-gradient(135deg,#60A5FA,#8B5CF6)", glow: "rgba(96,165,250,0.3)" },
    { label: "Escudo / FWC", value: data?.especiais ?? 0, sub: "logos e copa", icon: Trophy, gradient: "linear-gradient(135deg,#F59E0B,#60A5FA)", glow: "rgba(245,158,11,0.25)" },
    { label: "Foto da Seleção", value: data?.fotos13 ?? 0, sub: "posição 13", icon: Trophy, gradient: "linear-gradient(135deg,#34D399,#60A5FA)", glow: "rgba(52,211,153,0.25)" },
  ];

  const CARDS_EXTRAS = [
    { label: "Estoque de Extras", value: data?.extrasUnidades ?? 0, sub: "unidades disponíveis", icon: Sparkles, gradient: "linear-gradient(135deg,#A78BFA,#F472B6)", glow: "rgba(167,139,250,0.35)" },
    { label: "Valor em Estoque", value: brl(data?.extrasValorEstoque ?? 0), sub: "figurinhas especiais", icon: Package, gradient: "linear-gradient(135deg,#F472B6,#A78BFA)", glow: "rgba(244,114,182,0.3)" },
    { label: "Total Vendido", value: brl(data?.extrasVendido ?? 0), sub: "aprovados + separados + entregues", icon: BadgeDollarSign, gradient: "linear-gradient(135deg,#A78BFA,#60A5FA)", glow: "rgba(167,139,250,0.3)" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Olá,{" "}
            <span style={{ background: "linear-gradient(135deg,#8B5CF6,#60A5FA,#22D3EE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {user?.email?.split("@")[0] ?? "Colecionador"}
            </span>{" "}👋
          </h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>Copa do Mundo 2026 · visão geral do acervo</p>
        </div>
        <button
          onClick={sharePublic}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#8B5CF6" }}
        >
          Catálogo público
        </button>
      </div>

      {/* ── Figurinhas Copa ── */}
      <div>
        <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: "#71717A" }}>Figurinhas Copa 2026</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CARDS_COPA.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-2xl p-4 transition-all duration-300 cursor-default"
                style={{ background: "rgba(21,27,46,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${c.glow}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-3" style={{ background: c.gradient }}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {isLoading ? <span style={{ color: "#71717A" }}>—</span> : c.value}
                </div>
                <div className="text-xs font-semibold mt-0.5 text-white">{c.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#71717A" }}>{c.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Extras ── */}
      <div>
        <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest flex items-center gap-2" style={{ color: "#A78BFA" }}>
          <Sparkles className="h-3.5 w-3.5" />
          Extras
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CARDS_EXTRAS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-2xl p-4 transition-all duration-300 cursor-default"
                style={{ background: "rgba(30,15,46,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(167,139,250,0.2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${c.glow}`; e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.2)"; }}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-3" style={{ background: c.gradient }}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {isLoading ? <span style={{ color: "#71717A" }}>—</span> : c.value}
                </div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: "#E4E4E7" }}>{c.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#71717A" }}>{c.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold mb-4 uppercase tracking-widest" style={{ color: "#71717A" }}>Ações rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction to="/contagem"  icon={Sticker}       label="Contar"  sub="Registrar figurinhas" gradient="linear-gradient(135deg,#8B5CF6,#60A5FA)" />
          <QuickAction to="/stock"     icon={PackageSearch} label="Estoque" sub="Ver e editar"         gradient="linear-gradient(135deg,#60A5FA,#22D3EE)" />
          <QuickAction to="/sales"     icon={Receipt}       label="Vendas"  sub="Pedidos e histórico"  gradient="linear-gradient(135deg,#22D3EE,#34D399)" />
          <QuickAction to="/scan"      icon={ScanLine}      label="Scan"    sub="Câmera IA"            gradient="linear-gradient(135deg,#F59E0B,#8B5CF6)" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, sub, gradient }: { to: string; icon: typeof Sticker; label: string; sub: string; gradient: string }) {
  return (
    <Link to={to} className="group p-4 rounded-2xl flex flex-col gap-3 transition-all duration-200"
      style={{ background: "rgba(21,27,46,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}
      onMouseEnter={(e) => { e.currentTarget.style.border = "1px solid rgba(139,92,246,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(139,92,246,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: gradient }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "#71717A" }}>{sub}</div>
      </div>
    </Link>
  );
}

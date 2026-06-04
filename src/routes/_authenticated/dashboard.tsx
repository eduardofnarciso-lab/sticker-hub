import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package, Clock, Trophy, BadgeDollarSign,
  Sticker, PackageSearch, Receipt, ScanLine, TrendingUp,
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
        .select("status, total_value")
        .eq("user_id", user!.id);

      const list = stickers ?? [];
      const comEstoque = list.filter(
        (s) => (s.quantity ?? 0) > 0 && VALID_CODES.has(s.code ?? "")
      );

      const getPrice = (s: typeof comEstoque[0]) => s.price ? Number(s.price) : stickerPrice(s.code);
      const valorEstimado = comEstoque.reduce(
        (acc, s) => acc + getPrice(s) * (s.quantity ?? 0), 0
      );
      const normais   = comEstoque.filter((s) => getPrice(s) < 2).reduce((a, s) => a + s.quantity, 0);
      const especiais = comEstoque.filter((s) => getPrice(s) >= 2).reduce((a, s) => a + s.quantity, 0);
      const totalEmEstoque = normais + especiais;

      const ordersData    = orders ?? [];
      const valorVendido  = ordersData.filter((o) => ["aprovado","separado","entregue"].includes(o.status)).reduce((acc, o) => acc + Number(o.total_value), 0);
      const valorPendente = ordersData.filter((o) => o.status === "pendente").reduce((acc, o) => acc + Number(o.total_value), 0);
      const qtdPendentes  = ordersData.filter((o) => o.status === "pendente").length;

      return { valorEstimado, valorPendente, valorVendido, normais, especiais, totalEmEstoque, qtdPendentes };
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

  const CARDS = [
    { label: "Valor em Estoque", value: brl(data?.valorEstimado ?? 0), sub: `${data?.totalEmEstoque ?? 0} figurinhas disponíveis`, icon: Package, gradient: "linear-gradient(135deg,#8B5CF6,#60A5FA)", glow: "rgba(139,92,246,0.3)" },
    { label: "Total Vendido", value: brl(data?.valorVendido ?? 0), sub: "aprovados + separados + entregues", icon: BadgeDollarSign, gradient: "linear-gradient(135deg,#22D3EE,#34D399)", glow: "rgba(34,211,238,0.3)" },
    { label: "Pendente", value: brl(data?.valorPendente ?? 0), sub: `${data?.qtdPendentes ?? 0} pedido${(data?.qtdPendentes ?? 0) !== 1 ? "s" : ""} aguardando`, icon: Clock, gradient: "linear-gradient(135deg,#F59E0B,#EF4444)", glow: "rgba(245,158,11,0.3)" },
    { label: "Normais", value: data?.normais ?? 0, sub: "jogadores · R$ 1,00", icon: TrendingUp, gradient: "linear-gradient(135deg,#60A5FA,#8B5CF6)", glow: "rgba(96,165,250,0.3)" },
    { label: "Escudo / FWC", value: data?.especiais ?? 0, sub: "logos e copa · R$ 2,00", icon: Trophy, gradient: "linear-gradient(135deg,#F59E0B,#60A5FA)", glow: "rgba(245,158,11,0.25)" },
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CARDS.map((c) => {
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

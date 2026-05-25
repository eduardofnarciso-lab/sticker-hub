import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package, Clock, Star, Trophy, BadgeDollarSign,
  Sticker, PackageSearch, Receipt, Share2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getAllTemplates } from "@/lib/copa2026Data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Conjunto de códigos válidos do álbum Copa 2026
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

      const list = stickers ?? [];
      // Conta só os códigos válidos do álbum Copa 2026 (mesma base do Figurinhas)
      const comEstoque  = list.filter((s) => (s.quantity ?? 0) > 0 && VALID_CODES.has(s.code ?? ""));
      const pendentes   = list.filter((s) => s.status === "reservada");
      const vendidas    = list.filter((s) => s.status === "vendida");

      const valorEstimado = comEstoque.reduce(
        (acc, s) => acc + stickerPrice(s.code) * (s.quantity ?? 0), 0
      );
      const valorPendente = pendentes.reduce(
        (acc, s) => acc + stickerPrice(s.code) * (s.quantity ?? 0), 0
      );
      const valorVendido = vendidas.reduce(
        (acc, s) => acc + stickerPrice(s.code) * (s.quantity ?? 0), 0
      );
      const normais   = comEstoque.filter((s) => stickerPrice(s.code) === 1)
                                  .reduce((a, s) => a + s.quantity, 0);
      const especiais = comEstoque.filter((s) => stickerPrice(s.code) === 2)
                                  .reduce((a, s) => a + s.quantity, 0);
      const totalEmEstoque = normais + especiais;

      return { valorEstimado, valorPendente, valorVendido, normais, especiais, totalEmEstoque };
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
    {
      label: "Valor Estimado",
      value: brl(data?.valorEstimado ?? 0),
      sub: `${data?.totalEmEstoque ?? 0} figurinhas disponíveis`,
      icon: Package,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
    },
    {
      label: "Valor Vendido",
      value: brl(data?.valorVendido ?? 0),
      sub: "total já vendido",
      icon: BadgeDollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
    },
    {
      label: "Valor Pendente",
      value: brl(data?.valorPendente ?? 0),
      sub: "reservadas aguardando",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
    },
    {
      label: "Normais",
      value: data?.normais ?? 0,
      sub: "jogadores · R$ 1,00 cada",
      icon: Star,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
    },
    {
      label: "Escudo / FWC",
      value: data?.especiais ?? 0,
      sub: "logos e copa · R$ 2,00 cada",
      icon: Trophy,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Início</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Copa do Mundo 2026 · visão geral do acervo
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={sharePublic}>
          <Share2 className="h-4 w-4 mr-1" />
          Catálogo público
        </Button>
      </div>

      {/* 5 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-xl border p-4 shadow-sm ${c.bg}`}
            >
              <Icon className={`h-5 w-5 mb-3 ${c.color}`} />
              <div className={`text-2xl font-black tabular-nums ${c.color}`}>
                {isLoading ? "—" : c.value}
              </div>
              <div className={`text-sm font-semibold mt-0.5 ${c.color}`}>{c.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Ações rápidas */}
      <div>
        <h2 className="text-base font-semibold mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <QuickAction to="/contagem" icon={Sticker}       label="Contar figurinhas" />
          <QuickAction to="/stock"    icon={PackageSearch} label="Ver estoque"       />
          <QuickAction to="/sales"    icon={Receipt}       label="Vendas"            />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Sticker; label: string }) {
  return (
    <Link
      to={to}
      className="group p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col gap-2"
    >
      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium">{label}</div>
    </Link>
  );
}

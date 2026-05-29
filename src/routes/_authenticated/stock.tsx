import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search, Download, Package, Clock, CheckCircle2, AlertCircle, Plus, Minus, BadgeDollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { fmtCode, fmtName } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/stock")({
  component: StockPage,
});

// Preço por código: logo (X1) e FWC = R$2, demais = R$1
function stickerPrice(code: string | null): number {
  if (!code) return 1;
  if (code === "00" || code.startsWith("FWC")) return 2;
  if (/^[A-Z]{2,3}1$/.test(code)) return 2;  // Logo do time
  if (/^[A-Z]{2,3}13$/.test(code)) return 2; // Foto da Seleção
  return 1;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type FilterKey = "all" | "disponivel" | "reservada" | "vendida" | "falta";

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  disponivel: { bg: "rgba(34,211,238,0.1)",  color: "#22D3EE", border: "rgba(34,211,238,0.25)" },
  reservada:  { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "rgba(245,158,11,0.25)" },
  vendida:    { bg: "rgba(96,165,250,0.12)", color: "#60A5FA", border: "rgba(96,165,250,0.25)" },
};

function StockPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const adjustQty = useMutation({
    mutationFn: async ({ id, qty, delta }: { id: string; qty: number; delta: number }) => {
      const next = Math.max(0, qty + delta);
      const { error } = await supabase
        .from("stickers")
        .update({ quantity: next })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stickers", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ["stickers", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("id, code, name, team, quantity, status, price")
        .eq("user_id", user!.id)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("status, total_value")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  // Stats para os cards
  const stats = useMemo(() => {
    const disponiveis = stickers.filter((s) => s.quantity > 0 && s.status === "disponivel");
    const normais   = disponiveis.filter((s) => stickerPrice(s.code) === 1).reduce((a, s) => a + s.quantity, 0);
    const especiais = disponiveis.filter((s) => stickerPrice(s.code) === 2).reduce((a, s) => a + s.quantity, 0);
    const valorEstimado = disponiveis.reduce((acc, s) => acc + stickerPrice(s.code) * s.quantity, 0);

    // Vendidos e pendentes vêm da tabela orders
    const valorVendido  = orders.filter((o) => o.status === "aprovado").reduce((acc, o) => acc + Number(o.total_value), 0);
    const valorPendente = orders.filter((o) => o.status === "pendente").reduce((acc, o) => acc + Number(o.total_value), 0);
    const qtdPendentes  = orders.filter((o) => o.status === "pendente").length;

    return { valorEstimado, valorPendente, valorVendido, normais, especiais, qtdPendentes };
  }, [stickers, orders]);

  const valorTotal = stats.valorEstimado;

  // Filtro e busca
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stickers.filter((s) => {
      if (filter === "disponivel" && !(s.quantity > 0 && s.status === "disponivel")) return false;
      if (filter === "reservada"  && s.status !== "reservada") return false;
      if (filter === "vendida"    && s.status !== "vendida") return false;
      if (filter === "falta"      && !(s.quantity === 0 && s.status !== "vendida")) return false;
      if (term) {
        const hay = [s.code, s.name, s.team].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [stickers, search, filter]);

  const exportCSV = () => {
    const rows = [
      ["Codigo", "Nome", "Time", "Quantidade", "Preco", "Status"],
      ...filtered.map((s) => [
        s.code ?? "",
        s.name,
        s.team ?? "",
        s.quantity,
        stickerPrice(s.code).toFixed(2),
        s.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estoque-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CARDS = [
    {
      key: "disponivel" as FilterKey,
      label: "Valor Estimado",
      value: brl(stats.valorEstimado),
      sub: "em estoque disponível",
      icon: Package,
      accent: "#22D3EE",
    },
    {
      key: "vendida" as FilterKey,
      label: "Valor Vendido",
      value: brl(stats.valorVendido),
      sub: "pedidos aprovados",
      icon: BadgeDollarSign,
      accent: "#34D399",
    },
    {
      key: "reservada" as FilterKey,
      label: "Valor Pendente",
      value: brl(stats.valorPendente),
      sub: `${stats.qtdPendentes} pedido${stats.qtdPendentes !== 1 ? "s" : ""} aguardando`,
      icon: Clock,
      accent: "#F59E0B",
    },
    {
      key: "all" as FilterKey,
      label: "Normais",
      value: stats.normais,
      sub: "jogadores · R$ 1,00",
      icon: CheckCircle2,
      accent: "#60A5FA",
    },
    {
      key: "all" as FilterKey,
      label: "Escudo / FWC",
      value: stats.especiais,
      sub: "logos e copa · R$ 2,00",
      icon: AlertCircle,
      accent: "#8B5CF6",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>Estoque</h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>
            {stickers.length} figurinhas · valor total {brl(valorTotal)}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "#A1A1AA",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* 5 Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CARDS.map((c, i) => {
          const Icon = c.icon;
          const active = filter === c.key && c.key !== "all";
          return (
            <button
              key={`${c.key}-${i}`}
              onClick={() => c.key !== "all" && setFilter(active ? "all" : c.key)}
              className="rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: active
                  ? `rgba(${c.accent === "#22D3EE" ? "34,211,238" : c.accent === "#34D399" ? "52,211,153" : c.accent === "#F59E0B" ? "245,158,11" : c.accent === "#60A5FA" ? "96,165,250" : "139,92,246"},0.18)`
                  : "rgba(21,27,46,0.6)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${active ? c.accent + "55" : "rgba(255,255,255,0.07)"}`,
                boxShadow: active ? `0 0 20px ${c.accent}22` : "none",
                cursor: c.key === "all" ? "default" : "pointer",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-4 w-4" style={{ color: c.accent }} />
                {active && (
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>filtrado</span>
                )}
              </div>
              <div className="text-2xl font-black tabular-nums" style={{ color: active ? c.accent : "#FFFFFF" }}>
                {c.value}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: c.accent }}>
                {c.label}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "#71717A" }}>
                {c.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#71717A" }} />
        <Input
          className="pl-9"
          placeholder="Buscar por código, nome, time..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="py-12 text-center text-sm" style={{ color: "#71717A" }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "rgba(21,27,46,0.5)", border: "1px dashed rgba(255,255,255,0.1)" }}>
          <p style={{ color: "#A1A1AA" }}>Nada encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2 pb-8">
          {filtered.map((s) => {
            const price = stickerPrice(s.code);
            const emFalta = s.quantity === 0 && s.status !== "vendida";
            const statusStyle = emFalta
              ? { bg: "rgba(239,68,68,0.12)", color: "#EF4444", border: "rgba(239,68,68,0.25)" }
              : (STATUS_STYLES[s.status] ?? { bg: "rgba(255,255,255,0.05)", color: "#A1A1AA", border: "rgba(255,255,255,0.1)" });
            return (
              <div key={s.id} className="rounded-2xl p-3 transition-all duration-200"
                style={{
                  background: emFalta ? "rgba(239,68,68,0.05)" : "rgba(21,27,46,0.6)",
                  backdropFilter: "blur(16px)",
                  border: emFalta ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex gap-3 items-center">
                  {/* Código */}
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                    style={{
                      background: emFalta
                        ? "rgba(239,68,68,0.12)"
                        : s.quantity > 0
                        ? "rgba(34,211,238,0.12)"
                        : "rgba(255,255,255,0.04)",
                      color: emFalta
                        ? "#EF4444"
                        : s.quantity > 0
                        ? "#22D3EE"
                        : "#52525B",
                    }}>
                    {fmtCode(s.code) || "—"}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-sm truncate block" style={{ color: "#E4E4E7" }}>
                      {fmtName(s.name)}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{ color: "#71717A" }}>{s.team ?? ""}</span>
                      <span className="text-xs font-semibold" style={{ color: "#A78BFA" }}>{brl(price)}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                        }}>
                        {emFalta ? "Em Falta"
                          : s.status === "disponivel" ? "Em Estoque"
                          : s.status === "reservada" ? "Pendente"
                          : "Vendida"}
                      </span>
                    </div>
                  </div>

                  {/* Quantidade + controles */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => adjustQty.mutate({ id: s.id, qty: s.quantity, delta: -1 })}
                      disabled={s.quantity === 0}
                      className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xl font-black tabular-nums w-8 text-center"
                      style={{
                        color: emFalta ? "#EF4444" : s.quantity > 0 ? "#22D3EE" : "#3F3F46",
                      }}>
                      {s.quantity}
                    </span>
                    <button
                      onClick={() => adjustQty.mutate({ id: s.id, qty: s.quantity, delta: 1 })}
                      className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200"
                      style={{ background: "rgba(34,211,238,0.1)", color: "#22D3EE" }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search, Download, Package, Clock, CheckCircle2, AlertCircle, Plus, Minus, BadgeDollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/stock")({
  component: StockPage,
});

// Preço por código: logo (X1) e FWC = R$2, demais = R$1
function stickerPrice(code: string | null): number {
  if (!code) return 1;
  if (code === "00" || code.startsWith("FWC")) return 2;
  // BRA1, MEX1, GER1… — letra(s) seguido exatamente de "1"
  if (/^[A-Z]{2,3}1$/.test(code)) return 2;
  return 1;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type FilterKey = "all" | "disponivel" | "reservada" | "vendida" | "falta";

const STATUS_COLORS: Record<string, string> = {
  disponivel: "bg-green-100 text-green-700 border-green-200",
  reservada:  "bg-amber-100 text-amber-700 border-amber-200",
  vendida:    "bg-blue-100 text-blue-700 border-blue-200",
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

  // Stats para os cards
  const stats = useMemo(() => {
    const disponiveis = stickers.filter((s) => s.quantity > 0 && s.status === "disponivel");
    const pendentes   = stickers.filter((s) => s.status === "reservada");
    const vendidas    = stickers.filter((s) => s.status === "vendida");

    const valorEstimado = disponiveis.reduce((acc, s) => acc + stickerPrice(s.code) * s.quantity, 0);
    const valorPendente = pendentes.reduce((acc, s) => acc + stickerPrice(s.code) * s.quantity, 0);
    const valorVendido  = vendidas.reduce((acc, s) => acc + stickerPrice(s.code) * s.quantity, 0);

    const normais  = disponiveis.filter((s) => stickerPrice(s.code) === 1).reduce((a, s) => a + s.quantity, 0);
    const especiais = disponiveis.filter((s) => stickerPrice(s.code) === 2).reduce((a, s) => a + s.quantity, 0);

    return { valorEstimado, valorPendente, valorVendido, normais, especiais };
  }, [stickers]);

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
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      activeBg: "bg-green-600 text-white border-green-600",
    },
    {
      key: "vendida" as FilterKey,
      label: "Valor Vendido",
      value: brl(stats.valorVendido),
      sub: "total já vendido",
      icon: BadgeDollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
      activeBg: "bg-emerald-600 text-white border-emerald-600",
    },
    {
      key: "reservada" as FilterKey,
      label: "Valor Pendente",
      value: brl(stats.valorPendente),
      sub: "reservadas / pendentes",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
      activeBg: "bg-amber-500 text-white border-amber-500",
    },
    {
      key: "all" as FilterKey,
      label: "Normais",
      value: stats.normais,
      sub: "jogadores · R$ 1,00",
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      activeBg: "bg-blue-600 text-white border-blue-600",
    },
    {
      key: "all" as FilterKey,
      label: "Escudo / FWC",
      value: stats.especiais,
      sub: "logos e copa · R$ 2,00",
      icon: AlertCircle,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200",
      activeBg: "bg-purple-600 text-white border-purple-600",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stickers.length} figurinhas · valor total {brl(valorTotal)}
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
      </div>

      {/* 5 Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(active ? "all" : c.key)}
              className={`rounded-xl border p-4 text-left transition-all shadow-sm hover:scale-[1.02] ${
                active ? c.activeBg : c.bg
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-5 w-5 ${active ? "text-white/90" : c.color}`} />
                {active && (
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">filtrado</span>
                )}
              </div>
              <div className={`text-3xl font-black tabular-nums ${active ? "text-white" : ""}`}>
                {c.value}
              </div>
              <div className={`text-xs font-semibold mt-0.5 ${active ? "text-white/80" : c.color}`}>
                {c.label}
              </div>
              <div className={`text-[11px] mt-0.5 ${active ? "text-white/60" : "text-muted-foreground"}`}>
                {c.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por código, nome, time..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-muted-foreground">Nada encontrado.</p>
        </Card>
      ) : (
        <div className="space-y-2 pb-8">
          {filtered.map((s) => {
            const price = stickerPrice(s.code);
            const emFalta = s.quantity === 0 && s.status !== "vendida";
            return (
              <Card key={s.id} className={`p-3 shadow-sm transition-colors ${emFalta ? "border-red-200 bg-red-50/30" : ""}`}>
                <div className="flex gap-3 items-center">
                  {/* Código */}
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold ${
                    emFalta
                      ? "bg-red-100 text-red-500"
                      : s.quantity > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {s.code ?? "—"}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{s.team ?? ""}</span>
                      <span className="text-xs font-semibold text-foreground">{brl(price)}</span>
                      {/* Badge status */}
                      {emFalta ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-red-100 text-red-600 border-red-200">
                          Em Falta
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground"
                        }`}>
                          {s.status === "disponivel" ? "Em Estoque"
                            : s.status === "reservada" ? "Pendente"
                            : "Vendida"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantidade + controles */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => adjustQty.mutate({ id: s.id, qty: s.quantity, delta: -1 })}
                      disabled={s.quantity === 0}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className={`text-xl font-black tabular-nums w-8 text-center ${
                      emFalta ? "text-red-400" : s.quantity > 0 ? "text-green-600" : "text-muted-foreground/40"
                    }`}>
                      {s.quantity}
                    </span>
                    <button
                      onClick={() => adjustQty.mutate({ id: s.id, qty: s.quantity, delta: 1 })}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

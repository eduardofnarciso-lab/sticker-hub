import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/stock-history")({
  component: StockHistoryPage,
});

type Movement = {
  id: string;
  sticker_code: string;
  type: "importacao" | "venda" | "cancelamento" | "ajuste";
  qty_before: number;
  qty_change: number;
  qty_after: number;
  notes: string | null;
  order_id: string | null;
  created_at: string;
};

const TYPE_LABEL: Record<Movement["type"], string> = {
  importacao:   "Importação",
  venda:        "Venda",
  cancelamento: "Cancelamento",
  ajuste:       "Ajuste",
};

const TYPE_COLOR: Record<Movement["type"], { bg: string; text: string; border: string }> = {
  importacao:   { bg: "rgba(34,197,94,0.10)",  text: "#22C55E", border: "rgba(34,197,94,0.25)"  },
  venda:        { bg: "rgba(239,68,68,0.10)",  text: "#F87171", border: "rgba(239,68,68,0.25)"  },
  cancelamento: { bg: "rgba(251,191,36,0.10)", text: "#FBB124", border: "rgba(251,191,36,0.25)" },
  ajuste:       { bg: "rgba(139,92,246,0.10)", text: "#A78BFA", border: "rgba(139,92,246,0.25)" },
};

function fmt(d: string) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function StockHistoryPage() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<Movement["type"] | "todos">("todos");
  const [filterCode, setFilterCode] = useState("");
  const [page, setPage]             = useState(0);
  const PAGE_SIZE = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["stock-movements", user?.id, filterType, filterCode, page],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase
        .from("stock_movements")
        .select("*", { count: "exact" })
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterType !== "todos") q = q.eq("type", filterType);
      if (filterCode.trim())       q = q.ilike("sticker_code", `%${filterCode.trim()}%`);

      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Movement[], total: count ?? 0 };
    },
  });

  const rows  = data?.rows  ?? [];
  const total = data?.total ?? 0;

  /* resumo de entradas/saídas */
  const { data: summary } = useQuery({
    queryKey: ["stock-movements-summary", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("stock_movements")
        .select("type, qty_change")
        .eq("user_id", user!.id);
      if (!data) return { entradas: 0, saidas: 0, total: 0 };
      const entradas = data.filter(r => r.qty_change > 0).reduce((a, r) => a + r.qty_change, 0);
      const saidas   = data.filter(r => r.qty_change < 0).reduce((a, r) => a + r.qty_change, 0);
      return { entradas, saidas: Math.abs(saidas), total: data.length };
    },
  });

  const filterBtnStyle = (active: boolean) => ({
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    border: active ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
    color: active ? "#C4B5FD" : "#71717A",
    transition: "all .15s",
  });

  return (
    <AppShell>
      <div style={{ color: "#F4F4F5" }}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: "#FFFFFF" }}>
            Histórico de Estoque
          </h1>
          <p className="text-sm mt-1" style={{ color: "#71717A" }}>
            Log completo de movimentações — importações, vendas, ajustes
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total movimentos", value: summary?.total ?? "—", color: "#A78BFA" },
            { label: "Total entradas",   value: `+${summary?.entradas ?? "—"}`, color: "#22C55E" },
            { label: "Total saídas",     value: `-${summary?.saidas ?? "—"}`,   color: "#F87171" },
          ].map((c) => (
            <div key={c.label}
              className="rounded-xl p-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-xs mb-1" style={{ color: "#71717A" }}>{c.label}</div>
              <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {/* type filter buttons */}
          {(["todos", "importacao", "venda", "cancelamento", "ajuste"] as const).map((t) => (
            <button key={t} style={filterBtnStyle(filterType === t)} onClick={() => { setFilterType(t); setPage(0); }}>
              {t === "todos" ? "Todos" : TYPE_LABEL[t]}
            </button>
          ))}

          {/* code search */}
          <input
            placeholder="Buscar código..."
            value={filterCode}
            onChange={(e) => { setFilterCode(e.target.value); setPage(0); }}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "#F4F4F5",
              fontSize: 13,
              outline: "none",
              width: 160,
            }}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Table header */}
          <div className="grid text-xs font-semibold px-4 py-2.5"
            style={{
              gridTemplateColumns: "1fr 120px 60px 60px 60px 160px",
              background: "rgba(255,255,255,0.04)",
              color: "#71717A",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span>Data / Figurinha</span>
            <span>Tipo</span>
            <span className="text-right">Antes</span>
            <span className="text-right">Var.</span>
            <span className="text-right">Depois</span>
            <span className="text-right">Pedido</span>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-sm" style={{ color: "#71717A" }}>
              Carregando...
            </div>
          )}

          {!isLoading && rows.length === 0 && (
            <div className="py-12 text-center" style={{ color: "#71717A" }}>
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">Nenhum movimento encontrado.</p>
              <p className="text-xs mt-1">Os movimentos serão registrados automaticamente quando houver vendas ou ajustes.</p>
            </div>
          )}

          {rows.map((r, i) => {
            const tc = TYPE_COLOR[r.type];
            const isPositive = r.qty_change > 0;
            return (
              <div key={r.id}
                className="grid items-center px-4 py-3 text-sm"
                style={{
                  gridTemplateColumns: "1fr 120px 60px 60px 60px 160px",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {/* Code + date */}
                <div>
                  <span className="font-mono font-semibold" style={{ color: "#E4E4E7" }}>
                    {r.sticker_code}
                  </span>
                  {r.notes && (
                    <span className="ml-2 text-xs" style={{ color: "#71717A" }}>{r.notes}</span>
                  )}
                  <div className="text-xs mt-0.5" style={{ color: "#52525B" }}>{fmt(r.created_at)}</div>
                </div>

                {/* Type badge */}
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                  >
                    {TYPE_LABEL[r.type]}
                  </span>
                </div>

                {/* Before */}
                <div className="text-right font-mono text-xs" style={{ color: "#A1A1AA" }}>
                  {r.qty_before}
                </div>

                {/* Change */}
                <div className="text-right font-mono text-xs font-semibold"
                  style={{ color: isPositive ? "#22C55E" : "#F87171" }}
                >
                  {isPositive ? `+${r.qty_change}` : r.qty_change}
                </div>

                {/* After */}
                <div className="text-right font-mono text-xs font-bold" style={{ color: "#E4E4E7" }}>
                  {r.qty_after}
                </div>

                {/* Order ID */}
                <div className="text-right font-mono text-xs" style={{ color: "#52525B" }}>
                  {r.order_id ? r.order_id.slice(0, 8).toUpperCase() : "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs" style={{ color: "#71717A" }}>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: page === 0 ? "#3F3F46" : "#A1A1AA",
                  cursor: page === 0 ? "not-allowed" : "pointer",
                }}
              >
                ← Anterior
              </button>
              <button
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: (page + 1) * PAGE_SIZE >= total ? "#3F3F46" : "#A1A1AA",
                  cursor: (page + 1) * PAGE_SIZE >= total ? "not-allowed" : "pointer",
                }}
              >
                Próxima →
              </button>
            </div>
          </div>
        )}

        {/* Info: quando o histórico registra */}
        <div className="mt-6 rounded-xl p-4"
          style={{
            background: "rgba(96,165,250,0.06)",
            border: "1px solid rgba(96,165,250,0.12)",
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "#60A5FA" }}>
            ℹ️ Quando os movimentos são registrados
          </p>
          <p className="text-xs" style={{ color: "#71717A" }}>
            O histórico registra automaticamente toda alteração de quantidade nas figurinhas —
            quando você marca um pedido como <strong style={{ color: "#A1A1AA" }}>Separado</strong> ou <strong style={{ color: "#A1A1AA" }}>Entregue</strong> na tela de Vendas,
            ou faz ajustes manuais no Estoque. Pedidos pendentes no catálogo não reduzem o estoque ainda (só reservam).
          </p>
        </div>

      </div>
    </AppShell>
  );
}

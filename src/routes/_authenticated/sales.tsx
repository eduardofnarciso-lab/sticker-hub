import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  Plus, ShoppingBag, Check, X, Phone, User,
  Clock, PackageCheck, Ban, BadgeDollarSign, Receipt,
  MessageCircle, Package, Truck, CheckSquare, Square,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { brl, fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesPage,
});

type Order = {
  id: string;
  buyer_name: string;
  buyer_whatsapp: string;
  status: "pendente" | "aprovado" | "cancelado" | "separado" | "entregue";
  total_value: number;
  notes: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    sticker_code: string | null;
    sticker_name: string | null;
    quantity: number;
    unit_price: number;
  }>;
};

function statusBadge(status: string) {
  if (status === "pendente")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>
        <Clock className="h-3 w-3" />Pendente
      </span>
    );
  if (status === "aprovado")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: "rgba(34,211,238,0.12)", color: "#22D3EE", border: "1px solid rgba(34,211,238,0.25)" }}>
        <PackageCheck className="h-3 w-3" />Aprovado
      </span>
    );
  if (status === "separado")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.3)" }}>
        <Package className="h-3 w-3" />Separado
      </span>
    );
  if (status === "entregue")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)" }}>
        <Truck className="h-3 w-3" />Entregue
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
      <Ban className="h-3 w-3" />Cancelado
    </span>
  );
}

// ─── Card de pedido ────────────────────────────────────────────────────
function OrderCard({
  order, onApprove, onCancel, onSeparado, onEntregue, approving, cancelling, updating,
}: {
  order: Order;
  onApprove?: () => void;
  onCancel?: () => void;
  onSeparado?: () => void;
  onEntregue?: () => void;
  approving?: boolean;
  cancelling?: boolean;
  updating?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked]   = useState<Record<string, boolean>>({});
  const isPending   = order.status === "pendente";
  const isAprovado  = order.status === "aprovado";
  const isSeparado  = order.status === "separado";
  const allChecked  = order.order_items.length > 0 &&
    order.order_items.every((item) => checked[item.id]);

  return (
    <div className="rounded-2xl p-4 transition-all duration-200"
      style={{
        background: isPending
          ? "rgba(245,158,11,0.06)"
          : "rgba(21,27,46,0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: isPending
          ? "1px solid rgba(245,158,11,0.2)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge(order.status)}
            <span className="text-[11px] font-mono" style={{ color: "#71717A" }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-[11px] ml-auto" style={{ color: "#71717A" }}>{fmtDate(order.created_at)}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-sm font-medium" style={{ color: "#E4E4E7" }}>
              <User className="h-3.5 w-3.5" style={{ color: "#71717A" }} />
              {order.buyer_name}
            </span>
            {order.buyer_whatsapp && (
              <a
                href={`https://wa.me/55${order.buyer_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline transition-colors"
                style={{ color: "#22D3EE" }}
              >
                <Phone className="h-3 w-3" />
                {order.buyer_whatsapp}
              </a>
            )}
          </div>
        </div>
        {order.total_value > 0 && (
          <div className="text-right shrink-0 font-bold text-sm" style={{ color: "#22D3EE" }}>
            {brl(order.total_value)}
          </div>
        )}
      </div>

      {/* Itens */}
      <button className="w-full text-left mt-2" onClick={() => setExpanded((v) => !v)}>
        <div className="text-xs transition-colors" style={{ color: "#71717A" }}>
          {(() => {
            const totalQty = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
            return `${totalQty} figurinha${totalQty !== 1 ? "s" : ""}`;
          })()}
          {" — "}{expanded ? "ocultar ▲" : "ver itens ▼"}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 pl-2" style={{ borderLeft: "2px solid rgba(139,92,246,0.3)" }}>
          {(isAprovado || isSeparado) && (
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px]" style={{ color: "#71717A" }}>
                Marque cada figurinha ao separar:
              </p>
              <button
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all"
                style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}
                onClick={() => {
                  const all: Record<string, boolean> = {};
                  order.order_items.forEach((item) => { all[item.id] = true; });
                  setChecked(all);
                }}
              >
                Marcar tudo ✓
              </button>
            </div>
          )}
          {order.order_items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 text-xs py-0.5 cursor-pointer rounded-lg px-1 transition-all"
              style={{ background: checked[item.id] ? "rgba(34,197,94,0.06)" : "transparent" }}
              onClick={() => {
                if (!isAprovado && !isSeparado) return;
                setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
              }}
            >
              {(isAprovado || isSeparado) ? (
                checked[item.id]
                  ? <CheckSquare className="h-4 w-4 shrink-0" style={{ color: "#22C55E" }} />
                  : <Square className="h-4 w-4 shrink-0" style={{ color: "#71717A" }} />
              ) : null}
              <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] w-14 text-center shrink-0"
                style={{
                  background: checked[item.id] ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)",
                  color: checked[item.id] ? "#22C55E" : "#A78BFA",
                }}>
                {item.sticker_code ?? "—"}
              </span>
              <span className="flex-1 truncate" style={{
                color: checked[item.id] ? "#71717A" : "#A1A1AA",
                textDecoration: checked[item.id] ? "line-through" : "none",
              }}>{item.sticker_name}</span>
              <span className="shrink-0 font-medium" style={{ color: "#E4E4E7" }}>×{item.quantity}</span>
              {item.unit_price > 0 && (
                <span className="shrink-0" style={{ color: "#71717A" }}>{brl(item.unit_price * item.quantity)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {isPending && onApprove && onCancel && (
        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: "rgba(34,211,238,0.15)", color: "#22D3EE", border: "1px solid rgba(34,211,238,0.25)" }}
            onClick={onApprove}
            disabled={approving || cancelling}
          >
            <Check className="h-3.5 w-3.5" />
            Confirmar pagamento
          </button>
          <button
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
            onClick={onCancel}
            disabled={approving || cancelling}
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      )}

      {isAprovado && onSeparado && (
        <div className="mt-3">
          {!expanded && (
            <p className="text-[10px] mb-2" style={{ color: "#71717A" }}>
              Expanda os itens e marque cada figurinha separada antes de continuar.
            </p>
          )}
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{
              background: allChecked ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.07)",
              color: allChecked ? "#A78BFA" : "#6B7280",
              border: allChecked ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(139,92,246,0.15)",
            }}
            onClick={onSeparado}
            disabled={!allChecked || updating}
          >
            <Package className="h-3.5 w-3.5" />
            {allChecked ? "Marcar como Separado" : `Separe todos os itens (${Object.values(checked).filter(Boolean).length}/${order.order_items.length})`}
          </button>
        </div>
      )}

      {isSeparado && onEntregue && (
        <div className="mt-3">
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" }}
            onClick={onEntregue}
            disabled={updating}
          >
            <Truck className="h-3.5 w-3.5" />
            Marcar como Entregue
          </button>
        </div>
      )}

      {/* Botão WhatsApp para aprovados */}
      {order.status === "aprovado" && order.buyer_whatsapp && (
        <a
          href={`https://wa.me/55${order.buyer_whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 text-xs hover:underline transition-colors"
          style={{ color: "#22D3EE" }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Falar com o comprador
        </a>
      )}
    </div>
  );
}

// ─── Seção de pedidos do catálogo ─────────────────────────────────────
function OrdersSection({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, sticker_code, sticker_name, quantity, unit_price)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("approve_order", { p_order_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido aprovado! Estoque debitado.");
      qc.invalidateQueries({ queryKey: ["orders", userId] });
      qc.invalidateQueries({ queryKey: ["stickers", userId] });
      qc.invalidateQueries({ queryKey: ["stickers-contagem", userId] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats", userId] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("cancel_order", { p_order_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido cancelado.");
      qc.invalidateQueries({ queryKey: ["orders", userId] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      const label = status === "separado" ? "Pedido marcado como separado!" : "Pedido marcado como entregue! ✅";
      toast.success(label);
      qc.invalidateQueries({ queryKey: ["orders", userId] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  const pendentes   = orders.filter((o) => o.status === "pendente");
  const aprovados   = orders.filter((o) => o.status === "aprovado");
  const separados   = orders.filter((o) => o.status === "separado");
  const processados = orders.filter((o) => ["cancelado", "entregue"].includes(o.status));

  if (isLoading) return (
    <div className="py-12 text-center text-sm" style={{ color: "#71717A" }}>
      Carregando pedidos...
    </div>
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center"
        style={{
          background: "rgba(21,27,46,0.5)",
          border: "1px dashed rgba(255,255,255,0.1)",
        }}
      >
        <ShoppingBag className="h-8 w-8 mx-auto mb-3" style={{ color: "rgba(139,92,246,0.4)" }} />
        <p className="text-sm" style={{ color: "#A1A1AA" }}>Nenhum pedido recebido ainda.</p>
        <p className="text-xs mt-1" style={{ color: "#71717A" }}>Compartilhe o link do catálogo para começar a receber pedidos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pendentes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#F59E0B" }}>
            <Clock className="h-4 w-4" />
            {pendentes.length} aguardando aprovação
          </p>
          {pendentes.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onApprove={() => approve.mutate(order.id)}
              onCancel={() => cancel.mutate(order.id)}
              approving={approve.isPending}
              cancelling={cancel.isPending}
            />
          ))}
        </div>
      )}

      {aprovados.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#22D3EE" }}>
            <PackageCheck className="h-4 w-4" />
            {aprovados.length} para separar
          </p>
          {aprovados.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onSeparado={() => updateStatus.mutate({ id: order.id, status: "separado" })}
              updating={updateStatus.isPending}
            />
          ))}
        </div>
      )}

      {separados.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#A78BFA" }}>
            <Package className="h-4 w-4" />
            {separados.length} separado{separados.length > 1 ? "s" : ""} — aguardando entrega
          </p>
          {separados.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onEntregue={() => updateStatus.mutate({ id: order.id, status: "entregue" })}
              updating={updateStatus.isPending}
            />
          ))}
        </div>
      )}

      {processados.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: "#71717A" }}>Histórico</p>
          {processados.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────
function SalesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<"pedidos" | "manual">("pedidos");

  // Vendas manuais
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["sales", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, stickers(name, code)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Stickers disponíveis para venda manual
  const { data: stickers = [] } = useQuery({
    queryKey: ["stickers-for-sale", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("stickers")
        .select("id, name, code, quantity, price")
        .eq("user_id", user!.id)
        .gt("quantity", 0)
        .order("code");
      return data ?? [];
    },
  });

  // Contagem de pedidos pendentes (para badge)
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-orders-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "pendente");
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });

  // Stats de vendas manuais
  const totalVendas = sales.reduce((acc, s) => acc + Number(s.sale_price) * s.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
            Vendas
          </h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>Pedidos do catálogo e vendas manuais.</p>
        </div>
        {tab === "manual" && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
              color: "#fff",
              boxShadow: "0 0 20px rgba(139,92,246,0.3)",
            }}
          >
            <Plus className="h-4 w-4" />
            Nova venda
          </button>
        )}
      </div>

      {/* Stats rápidos (vendas manuais) */}
      {tab === "manual" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4"
            style={{
              background: "rgba(21,27,46,0.6)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(96,165,250,0.15)",
            }}
          >
            <Receipt className="h-4 w-4 mb-2" style={{ color: "#60A5FA" }} />
            <div className="text-2xl font-black" style={{ color: "#60A5FA" }}>{sales.length}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "#A1A1AA" }}>Vendas registradas</div>
          </div>
          <div className="rounded-2xl p-4"
            style={{
              background: "rgba(21,27,46,0.6)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(34,211,238,0.15)",
            }}
          >
            <BadgeDollarSign className="h-4 w-4 mb-2" style={{ color: "#22D3EE" }} />
            <div className="text-2xl font-black" style={{ color: "#22D3EE" }}>{brl(totalVendas)}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "#A1A1AA" }}>Total recebido</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => setTab("pedidos")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: tab === "pedidos" ? "rgba(139,92,246,0.2)" : "transparent",
            color: tab === "pedidos" ? "#A78BFA" : "#71717A",
            border: tab === "pedidos" ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
          }}
        >
          <ShoppingBag className="h-4 w-4" />
          Pedidos do catálogo
          {pendingCount > 0 && (
            <span className="text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
              style={{ background: "#F59E0B" }}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("manual")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: tab === "manual" ? "rgba(139,92,246,0.2)" : "transparent",
            color: tab === "manual" ? "#A78BFA" : "#71717A",
            border: tab === "manual" ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
          }}
        >
          <Receipt className="h-4 w-4" />
          Vendas manuais
        </button>
      </div>

      {/* Conteúdo */}
      {tab === "pedidos" ? (
        <OrdersSection userId={user?.id ?? ""} />
      ) : (
        <>
          {salesLoading ? (
            <div className="py-12 text-center text-sm" style={{ color: "#71717A" }}>Carregando...</div>
          ) : sales.length === 0 ? (
            <div className="rounded-2xl p-10 text-center"
              style={{
                background: "rgba(21,27,46,0.5)",
                border: "1px dashed rgba(255,255,255,0.1)",
              }}
            >
              <Receipt className="h-8 w-8 mx-auto mb-3" style={{ color: "rgba(139,92,246,0.4)" }} />
              <p style={{ color: "#A1A1AA" }}>Nenhuma venda registrada.</p>
              <p className="text-xs mt-1" style={{ color: "#71717A" }}>Clique em "Nova venda" para registrar manualmente.</p>
            </div>
          ) : (
            <div className="space-y-2 pb-8">
              {sales.map((s) => (
                <div key={s.id} className="rounded-2xl p-3 transition-all duration-200"
                  style={{
                    background: "rgba(21,27,46,0.6)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.07)",
      
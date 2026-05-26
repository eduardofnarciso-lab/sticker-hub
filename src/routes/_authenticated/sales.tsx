import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  Plus, ShoppingBag, Check, X, Phone, User,
  Clock, PackageCheck, Ban, BadgeDollarSign, Receipt,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  status: "pendente" | "aprovado" | "cancelado";
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
    return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
  if (status === "aprovado")
    return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 gap-1"><PackageCheck className="h-3 w-3" />Aprovado</Badge>;
  return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 gap-1"><Ban className="h-3 w-3" />Cancelado</Badge>;
}

// ─── Card de pedido ────────────────────────────────────────────────────
function OrderCard({
  order, onApprove, onCancel, approving, cancelling,
}: {
  order: Order;
  onApprove?: () => void;
  onCancel?: () => void;
  approving?: boolean;
  cancelling?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending = order.status === "pendente";

  return (
    <Card className={`p-3 shadow-sm transition-colors ${isPending ? "border-amber-200 bg-amber-50/30" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge(order.status)}
            <span className="text-[11px] text-muted-foreground font-mono">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-[11px] text-muted-foreground ml-auto">{fmtDate(order.created_at)}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-sm font-medium">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {order.buyer_name}
            </span>
            {order.buyer_whatsapp && (
              <a
                href={`https://wa.me/55${order.buyer_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-green-700 hover:underline"
              >
                <Phone className="h-3 w-3" />
                {order.buyer_whatsapp}
              </a>
            )}
          </div>
        </div>
        {order.total_value > 0 && (
          <div className="text-right shrink-0 font-semibold text-sm">{brl(order.total_value)}</div>
        )}
      </div>

      {/* Itens */}
      <button className="w-full text-left mt-2" onClick={() => setExpanded((v) => !v)}>
        <div className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          {order.order_items.length} figurinha{order.order_items.length !== 1 ? "s" : ""}
          {" — "}{expanded ? "ocultar ▲" : "ver itens ▼"}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 space-y-0.5 pl-2 border-l-2 border-muted">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs py-0.5">
              <span className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-[10px] w-14 text-center shrink-0">
                {item.sticker_code ?? "—"}
              </span>
              <span className="flex-1 truncate text-muted-foreground">{item.sticker_name}</span>
              <span className="shrink-0 font-medium">×{item.quantity}</span>
              {item.unit_price > 0 && (
                <span className="shrink-0 text-muted-foreground">{brl(item.unit_price * item.quantity)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {isPending && onApprove && onCancel && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 gap-1.5"
            onClick={onApprove}
            disabled={approving || cancelling}
          >
            <Check className="h-3.5 w-3.5" />
            Aprovar e debitar estoque
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
            onClick={onCancel}
            disabled={approving || cancelling}
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Botão WhatsApp para aprovados */}
      {order.status === "aprovado" && order.buyer_whatsapp && (
        <a
          href={`https://wa.me/55${order.buyer_whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 text-xs text-green-700 hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Falar com o comprador
        </a>
      )}
    </Card>
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

  const pendentes   = orders.filter((o) => o.status === "pendente");
  const processados = orders.filter((o) => o.status !== "pendente");

  if (isLoading) return <div className="text-sm text-muted-foreground py-8 text-center">Carregando pedidos...</div>;

  if (orders.length === 0) {
    return (
      <Card className="p-10 text-center border-dashed">
        <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Nenhum pedido recebido ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">Compartilhe o link do catálogo para começar a receber pedidos.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendentes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {pendentes.length} pedido{pendentes.length > 1 ? "s" : ""} aguardando aprovação
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

      {processados.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Histórico de pedidos</p>
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
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Pedidos do catálogo e vendas manuais.</p>
        </div>
        {tab === "manual" && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova venda
          </Button>
        )}
      </div>

      {/* Stats rápidos (vendas manuais) */}
      {tab === "manual" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
            <Receipt className="h-4 w-4 text-blue-600 mb-2" />
            <div className="text-2xl font-black text-blue-600">{sales.length}</div>
            <div className="text-xs font-semibold text-blue-600">Vendas registradas</div>
          </div>
          <div className="rounded-xl border p-4 bg-emerald-50 border-emerald-200">
            <BadgeDollarSign className="h-4 w-4 text-emerald-600 mb-2" />
            <div className="text-2xl font-black text-emerald-600">{brl(totalVendas)}</div>
            <div className="text-xs font-semibold text-emerald-600">Total recebido</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setTab("pedidos")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "pedidos" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Pedidos do catálogo
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("manual")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
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
            <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
          ) : sales.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhuma venda registrada.</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Nova venda" para registrar manualmente.</p>
            </Card>
          ) : (
            <div className="space-y-2 pb-8">
              {sales.map((s) => (
                <Card key={s.id} className="p-3 shadow-sm">
                  <div className="flex gap-3 items-center">
                    <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center shrink-0 font-mono text-xs font-bold text-muted-foreground">
                      {s.stickers?.code ?? "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {s.stickers?.name ?? "Figurinha removida"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fmtDate(s.created_at)} · {s.quantity} un.
                        {s.buyer_name ? ` · ${s.buyer_name}` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm text-emerald-700">{brl(Number(s.sale_price) * s.quantity)}</div>
                      <div className="text-[10px] text-muted-foreground">{brl(Number(s.sale_price))} cada</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialog nova venda */}
      <NewSaleDialog
        open={open}
        onOpenChange={setOpen}
        stickers={stickers}
        userId={user?.id ?? ""}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["sales", user?.id] });
          qc.invalidateQueries({ queryKey: ["stickers", user?.id] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats", user?.id] });
          qc.invalidateQueries({ queryKey: ["stickers-for-sale", user?.id] });
        }}
      />
    </div>
  );
}

// ─── Dialog de nova venda manual ──────────────────────────────────────
function NewSaleDialog({
  open, onOpenChange, stickers, userId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stickers: Array<{ id: string; name: string; code: string | null; quantity: number; price: number }>;
  userId: string;
  onSaved: () => void;
}) {
  const [stickerId, setStickerId] = useState("");
  const [quantity, setQuantity]   = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [buyerName, setBuyerName] = useState("");
  const [loading, setLoading]     = useState(false);

  const sel = stickers.find((s) => s.id === stickerId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sel)               return toast.error("Selecione uma figurinha");
    if (quantity <= 0)      return toast.error("Quantidade inválida");
    if (quantity > sel.quantity) return toast.error(`Estoque insuficiente (${sel.quantity} disponíveis)`);

    setLoading(true);
    try {
      const { error: saleErr } = await supabase.from("sales").insert({
        user_id:    userId,
        sticker_id: sel.id,
        quantity,
        sale_price: salePrice,
        buyer_name: buyerName || null,
      });
      if (saleErr) throw saleErr;

      const newQty = sel.quantity - quantity;
      const { error: upErr } = await supabase
        .from("stickers")
        .update({
          quantity: newQty,
          status:   newQty === 0 ? "vendida" : "disponivel",
        })
        .eq("id", sel.id)
        .eq("user_id", userId);
      if (upErr) throw upErr;

      toast.success("Venda registrada!");
      onSaved();
      onOpenChange(false);
      setStickerId(""); setQuantity(1); setSalePrice(0); setBuyerName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar venda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova venda manual</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Figurinha *</Label>
            <Select value={stickerId} onValueChange={(v) => {
              setStickerId(v);
              const s = stickers.find((x) => x.id === v);
              if (s) setSalePrice(Number(s.price));
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione a figurinha" /></SelectTrigger>
              <SelectContent>
                {stickers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code ? `${s.code} — ` : ""}{s.name} ({s.quantity} em estoque)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input type="number" min={1} max={sel?.quantity ?? 1} value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Valor unitário (R$)</Label>
              <Input type="number" min={0} step="0.01" value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))} required />
            </div>
          </div>
          {sel && quantity > 0 && salePrice > 0 && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-700">
              Total: {brl(salePrice * quantity)}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Comprador (opcional)</Label>
            <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nome do comprador" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Registrar venda"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

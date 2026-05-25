import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Sticker, Search, ShoppingCart, Plus, Minus, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { flagUrl, TEAM_ISO } from "@/lib/copa2026Data";
import { toast } from "sonner";

export const Route = createFileRoute("/public-catalog/$userId")({
  component: PublicCatalog,
  head: () => ({
    meta: [
      { title: "Figurinhas Copa 2026 — Catálogo" },
      { name: "description", content: "Compre figurinhas da Copa do Mundo 2026." },
    ],
  }),
});

type CartItem = {
  id: string;
  code: string;
  name: string;
  team: string;
  price: number;
  qty: number;
  maxQty: number;
};

// Extrai código do time a partir do código da figurinha (ex: "BRA1" → "BRA")
function teamCodeFromSticker(code: string | null): string {
  if (!code) return "";
  if (code === "00" || code.startsWith("FWC")) return "INTRO";
  const m = code.match(/^([A-Z]{2,3})/);
  return m ? m[1] : "";
}

function PublicCatalog() {
  const { userId } = Route.useParams();
  const [search, setSearch]       = useState("");
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]   = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [sending, setSending]     = useState(false);

  // Busca perfil do vendedor (nome + WhatsApp)
  const { data: seller } = useQuery({
    queryKey: ["seller-profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, whatsapp")
        .eq("id", userId)
        .maybeSingle();
      return data;
    },
  });

  // Busca figurinhas disponíveis do vendedor
  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ["public-stickers", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("id, code, name, team, quantity, price")
        .eq("user_id", userId)
        .eq("status", "disponivel")
        .gt("quantity", 0)
        .order("code", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Agrupa por time, mantendo ordem
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = new Map<string, { teamCode: string; items: typeof stickers }>();

    for (const s of stickers) {
      const key      = s.team?.trim() || "Copa do Mundo";
      const teamCode = teamCodeFromSticker(s.code);
      if (term) {
        const hay = [s.code, s.name, key].join(" ").toLowerCase();
        if (!hay.includes(term)) continue;
      }
      if (!map.has(key)) map.set(key, { teamCode, items: [] });
      map.get(key)!.items.push(s);
    }
    return Array.from(map.entries());
  }, [stickers, search]);

  // Carrinho
  const cartTotal = cart.reduce((acc, i) => acc + i.qty, 0);
  const cartValue = cart.reduce((acc, i) => acc + i.qty * i.price, 0);

  const addToCart = (s: typeof stickers[number]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === s.id);
      if (existing) {
        if (existing.qty >= existing.maxQty) {
          toast.warning("Quantidade máxima disponível atingida");
          return prev;
        }
        return prev.map((c) => c.id === s.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, {
        id:     s.id,
        code:   s.code ?? "",
        name:   s.name,
        team:   s.team ?? "",
        price:  Number(s.price ?? 0),
        qty:    1,
        maxQty: s.quantity,
      }];
    });
    toast.success(`${s.code} adicionada!`);
  };

  const removeFromCart = (id: string) => setCart((p) => p.filter((c) => c.id !== id));

  const changeQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      return { ...c, qty: Math.max(1, Math.min(c.maxQty, c.qty + delta)) };
    }));
  };

  const sendOrder = async () => {
    if (!buyerName.trim())  { toast.error("Digite seu nome"); return; }
    if (!buyerPhone.trim()) { toast.error("Digite seu WhatsApp"); return; }
    if (cart.length === 0)  { toast.error("Carrinho vazio"); return; }

    setSending(true);
    try {
      // Salva pedido no banco vinculado ao vendedor
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          seller_id:      userId,
          buyer_name:     buyerName.trim(),
          buyer_whatsapp: buyerPhone.trim().replace(/\D/g, ""),
          status:         "pendente",
          total_value:    cartValue,
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const { error: itemsErr } = await supabase.from("order_items").insert(
        cart.map((c) => ({
          order_id:     order.id,
          sticker_id:   c.id,
          sticker_code: c.code,
          sticker_name: c.name,
          quantity:     c.qty,
          unit_price:   c.price,
        }))
      );
      if (itemsErr) throw itemsErr;

      // Monta mensagem WhatsApp para o vendedor
      const sellerPhone = (seller?.whatsapp ?? "").replace(/\D/g, "");
      const linhas = cart.map((c) => `• ${c.code} — ${c.name} × ${c.qty} = ${brl(c.qty * c.price)}`);
      const msg = [
        `🏷️ *Pedido de Figurinhas Copa 2026*`,
        ``,
        `👤 *Nome:* ${buyerName}`,
        `📱 *WhatsApp:* ${buyerPhone}`,
        ``,
        `📋 *Figurinhas:*`,
        ...linhas,
        ``,
        `💰 *Total: ${brl(cartValue)}*`,
        ``,
        `🆔 Pedido: #${order.id.slice(0, 8).toUpperCase()}`,
      ].join("\n");

      const waUrl = sellerPhone
        ? `https://wa.me/55${sellerPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;

      window.open(waUrl, "_blank");
      toast.success("Pedido registrado! Abrindo WhatsApp...");
      setCart([]); setCartOpen(false); setBuyerName(""); setBuyerPhone("");
    } catch (e: any) {
      toast.error("Erro ao enviar: " + (e?.message ?? String(e)));
    } finally {
      setSending(false);
    }
  };

  const sellerName = seller?.display_name ?? "Vendedor";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-20 backdrop-blur bg-card/95">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Sticker className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Catálogo — {sellerName}</div>
            <div className="text-xs text-muted-foreground">{stickers.length} figurinhas disponíveis · Copa 2026</div>
          </div>
          <Button
            variant="outline"
            className="relative gap-2 shrink-0"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            {cartTotal > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {cartTotal}
              </Badge>
            )}
            <span className="hidden sm:inline">{cartTotal > 0 ? `${cartTotal} iten${cartTotal > 1 ? "s" : ""}` : "Carrinho"}</span>
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar seleção ou código (BRA, MEX, FRA...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Carregando catálogo...</div>
        ) : stickers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sticker className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma figurinha disponível no momento.</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Nenhum resultado para "{search}".</div>
        ) : (
          <div className="space-y-6 pb-8">
            {groups.map(([team, { teamCode, items }]) => {
              const fUrl = flagUrl(teamCode, "w40");
              return (
                <div key={team}>
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b">
                    {fUrl
                      ? <img src={fUrl} alt={team} className="h-5 w-auto rounded-sm shadow-sm" />
                      : <span className="text-base">🏆</span>
                    }
                    <span className="font-semibold text-sm">{team}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{items.length} disponíve{items.length > 1 ? "is" : "l"}</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((s) => {
                      const inCart = cart.find((c) => c.id === s.id);
                      return (
                        <div key={s.id} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <span className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded w-16 text-center shrink-0">
                            {s.code}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{s.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {s.quantity} disponíve{s.quantity > 1 ? "is" : "l"}
                              {Number(s.price) > 0 && ` · ${brl(Number(s.price))}`}
                            </div>
                          </div>
                          {inCart ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50" onClick={() => changeQty(s.id, -1)}>
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-black text-primary">{inCart.qty}</span>
                              <button className="h-7 w-7 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50" onClick={() => changeQty(s.id, 1)}>
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(s)}
                              className="h-8 px-3 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors shrink-0"
                            >
                              + Quero
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Carrinho — bottom sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="bg-card rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">
                Carrinho · {cartTotal} figurinha{cartTotal !== 1 ? "s" : ""}
                {cartValue > 0 && <span className="text-muted-foreground font-normal text-sm ml-2">· {brl(cartValue)}</span>}
              </div>
              <button onClick={() => setCartOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">Carrinho vazio</div>
              ) : cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 py-1.5">
                  <span className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded w-14 text-center shrink-0">{item.code}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.name}</div>
                    {item.price > 0 && <div className="text-xs text-muted-foreground">{brl(item.price)} × {item.qty} = {brl(item.price * item.qty)}</div>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-red-500" onClick={() => changeQty(item.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                    <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-green-600" onClick={() => changeQty(item.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </button>
                    <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-red-50 text-red-400 ml-1" onClick={() => removeFromCart(item.id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="px-4 py-4 border-t space-y-3">
                {cartValue > 0 && (
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total</span>
                    <span className="text-green-700">{brl(cartValue)}</span>
                  </div>
                )}
                <Input
                  placeholder="Seu nome *"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
                <Input
                  placeholder="Seu WhatsApp com DDD *"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  type="tel"
                />
                <Button
                  className="w-full h-12 font-bold bg-green-600 hover:bg-green-700 gap-2 text-base"
                  onClick={sendOrder}
                  disabled={sending}
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Enviando..." : "Enviar pedido pelo WhatsApp"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Você será redirecionado ao WhatsApp do vendedor para confirmar.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 text-[10px] text-muted-foreground/40">
        Desenvolvido por <span className="font-semibold">SpiritRelay</span> · Empresa de Desenvolvimento
      </div>
    </div>
  );
}

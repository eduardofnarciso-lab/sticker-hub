import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Star, Search, ShoppingCart, Plus, Minus, X, Send, MessageCircle, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { brl, fmtCode } from "@/lib/format";
import { EXTRAS_PHONE, getRarityColor, getRarityKey, rarityLabel } from "@/lib/extrasData";

export const Route = createFileRoute("/extras-catalog/$userId")({
  component: ExtrasCatalog,
  head: () => ({
    meta: [
      { title: "Figurinhas Extras Copa 2026 — Catálogo" },
      { name: "description", content: "Figurinhas especiais (Ouro, Prata, Bronze, Lilás e Rosa) da Copa 2026." },
    ],
  }),
});

// ─── Constantes ──────────────────────────────────────────────────────────────
const INACTIVITY_MS = 15 * 60 * 1000; // 15 min sem interação → modal
const CONFIRM_MS    =  2 * 60 * 1000; //  2 min para confirmar → libera reservas

// ─── Tipos ───────────────────────────────────────────────────────────────────
type CartItem = {
  id: string;
  code: string;
  name: string;
  price: number;
  qty: number;
  maxQty: number;
};

// ─── Helpers de reserva (iguais ao catálogo principal) ───────────────────────
const db = supabase as any;

function getSessionId(): string {
  let id = sessionStorage.getItem("extras_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("extras_session_id", id);
  }
  return id;
}

async function dbReserve(sessionId: string, stickerId: string, qty: number) {
  const expires = new Date(Date.now() + INACTIVITY_MS + CONFIRM_MS + 60_000).toISOString();
  await db.from("cart_reservations").upsert(
    { session_id: sessionId, sticker_id: stickerId, quantity: qty, expires_at: expires },
    { onConflict: "session_id,sticker_id" }
  );
}

async function dbReleaseAll(sessionId: string) {
  await db.from("cart_reservations").delete().eq("session_id", sessionId);
}

async function fetchReservedMap(): Promise<Map<string, number>> {
  const now = new Date().toISOString();
  const { data } = await db
    .from("cart_reservations")
    .select("sticker_id, quantity")
    .gt("expires_at", now);
  const map = new Map<string, number>();
  for (const r of data ?? []) {
    map.set(r.sticker_id, (map.get(r.sticker_id) ?? 0) + r.quantity);
  }
  return map;
}

// número da extra dentro do conjunto (EX01..EX20) para ordenar
function extraSortNum(code: string): number {
  const m = code.match(/EX(\d+)/);
  return m ? parseInt(m[1], 10) : 999;
}
const RARITY_ORDER: Record<string, number> = { O: 0, P: 1, B: 2, L: 3, R: 4 };

// ─── Componente ──────────────────────────────────────────────────────────────
function ExtrasCatalog() {
  const { userId } = Route.useParams();
  const qc = useQueryClient();
  const sessionId = useRef(getSessionId()).current;

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [sending, setSending] = useState(false);
  const [waUrl, setWaUrl] = useState<string | null>(null);

  // Modal de inatividade
  const [inactiveModal, setInactiveModal] = useState(false);
  const [confirmSecs, setConfirmSecs] = useState(0);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>();
  const abandonTimer = useRef<ReturnType<typeof setTimeout>>();
  const countdownTimer = useRef<ReturnType<typeof setInterval>>();

  // ── Vendedor ────────────────────────────────────────────────────────────────
  const { data: seller } = useQuery({
    queryKey: ["seller-profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      return data;
    },
  });

  // ── Extras disponíveis ───────────────────────────────────────────────────────
  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ["extras-public", userId],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("id, code, name, quantity, price, image_url")
        .eq("user_id", userId)
        .eq("status", "disponivel")
        .gt("quantity", 0)
        .like("code", "EX%")
        .order("code", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reservedMap = new Map<string, number>() } = useQuery({
    queryKey: ["cart-reservations"],
    refetchInterval: 20_000,
    queryFn: fetchReservedMap,
  });

  // ── Cleanup ao sair ──────────────────────────────────────────────────────────
  useEffect(() => {
    const release = () => dbReleaseAll(sessionId);
    window.addEventListener("beforeunload", release);
    return () => {
      window.removeEventListener("beforeunload", release);
      release();
    };
  }, [sessionId]);

  // ── Timers de inatividade ─────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    clearTimeout(abandonTimer.current);
    clearInterval(countdownTimer.current);
  }, []);

  const triggerAbandon = useCallback(async () => {
    clearAllTimers();
    await dbReleaseAll(sessionId);
    setCart([]);
    setCartOpen(false);
    setInactiveModal(false);
    qc.invalidateQueries({ queryKey: ["cart-reservations"] });
    qc.invalidateQueries({ queryKey: ["extras-public", userId] });
    toast.info("Reservas liberadas por inatividade. Pode escolher novamente!");
  }, [sessionId, userId, qc, clearAllTimers]);

  const startInactivityTimer = useCallback(() => {
    clearAllTimers();
    inactivityTimer.current = setTimeout(() => {
      setInactiveModal(true);
      setConfirmSecs(120);
      countdownTimer.current = setInterval(() => {
        setConfirmSecs((s) => {
          if (s <= 1) { clearInterval(countdownTimer.current); return 0; }
          return s - 1;
        });
      }, 1000);
      abandonTimer.current = setTimeout(triggerAbandon, CONFIRM_MS);
    }, INACTIVITY_MS);
  }, [clearAllTimers, triggerAbandon]);

  const resetInactivity = useCallback(() => {
    if (cart.length === 0) return;
    setInactiveModal(false);
    clearTimeout(abandonTimer.current);
    clearInterval(countdownTimer.current);
    startInactivityTimer();
  }, [cart.length, startInactivityTimer]);

  useEffect(() => {
    if (cart.length === 0) { clearAllTimers(); setInactiveModal(false); return; }
    startInactivityTimer();
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    const handler = () => resetInactivity();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearAllTimers();
    };
  }, [cart.length, startInactivityTimer, resetInactivity, clearAllTimers]);

  // ── Disponibilidade ────────────────────────────────────────────────────────────
  const availableQty = useCallback(
    (s: (typeof stickers)[number]): number => {
      const myQty = cart.find((c) => c.id === s.id)?.qty ?? 0;
      const reserved = reservedMap.get(s.id) ?? 0;
      return Math.max(0, s.quantity - reserved + myQty);
    },
    [cart, reservedMap]
  );

  const cartCount = cart.reduce((acc, i) => acc + i.qty, 0);
  const cartValue = cart.reduce((acc, i) => acc + i.qty * i.price, 0);

  // ── Lista ordenada (jogador → raridade) + busca ──────────────────────────────
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = stickers.filter((s) => {
      if (!term) return true;
      return [s.code, s.name].join(" ").toLowerCase().includes(term);
    });
    return [...list].sort((a, b) => {
      const na = extraSortNum(a.code ?? ""), nb = extraSortNum(b.code ?? "");
      if (na !== nb) return na - nb;
      return (RARITY_ORDER[getRarityKey(a.code)] ?? 9) - (RARITY_ORDER[getRarityKey(b.code)] ?? 9);
    });
  }, [stickers, search]);

  // ── Carrinho ───────────────────────────────────────────────────────────────────
  const addToCart = async (s: (typeof stickers)[number]) => {
    const avail = availableQty(s);
    const existing = cart.find((c) => c.id === s.id);
    if (existing) {
      if (existing.qty >= avail) { toast.warning("Quantidade máxima disponível atingida"); return; }
      const newQty = existing.qty + 1;
      setCart((prev) => prev.map((c) => (c.id === s.id ? { ...c, qty: newQty } : c)));
      await dbReserve(sessionId, s.id, newQty);
    } else {
      if (avail <= 0) { toast.warning("Extra indisponível no momento"); return; }
      setCart((prev) => [
        ...prev,
        { id: s.id, code: s.code ?? "", name: s.name, price: Number(s.price) || 0, qty: 1, maxQty: avail },
      ]);
      await dbReserve(sessionId, s.id, 1);
    }
    qc.invalidateQueries({ queryKey: ["cart-reservations"] });
    toast.success(`${fmtCode(s.code)} adicionada!`);
  };

  const changeQty = async (id: string, delta: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.id !== id));
      await db.from("cart_reservations").delete().eq("session_id", sessionId).eq("sticker_id", id);
      qc.invalidateQueries({ queryKey: ["cart-reservations"] });
      return;
    }
    if (newQty > item.maxQty) { toast.warning("Máximo disponível atingido"); return; }
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: newQty } : c)));
    await dbReserve(sessionId, id, newQty);
    qc.invalidateQueries({ queryKey: ["cart-reservations"] });
  };

  // ── Negociar (WhatsApp direto na figurinha) ──────────────────────────────────
  const negotiateUrl = (s: { code: string | null; name: string; price: number }) => {
    const player = s.name.split(" — ")[0];
    const rar = rarityLabel[getRarityKey(s.code)] ?? s.name.split(" — ")[1] ?? "";
    const msg = [
      `Olá! Tenho interesse nesta figurinha EXTRA e quero negociar:`,
      ``,
      `⭐ *${player}* — ${rar}`,
      `🔖 Código: ${fmtCode(s.code)}`,
      Number(s.price) > 0 ? `💰 Preço de tabela: ${brl(s.price)}` : ``,
    ].filter(Boolean).join("\n");
    return `https://wa.me/${EXTRAS_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  // ── Envio do pedido (+Quero → checkout) ──────────────────────────────────────
  const sendOrder = async () => {
    if (!buyerName.trim())  { toast.error("Digite seu nome"); return; }
    if (!buyerPhone.trim()) { toast.error("Digite seu WhatsApp"); return; }
    if (!buyerCity.trim())  { toast.error("Digite sua cidade"); return; }
    if (cart.length === 0)  { toast.error("Carrinho vazio"); return; }

    setSending(true);
    try {
      const { data: orderId, error } = await (supabase as any).rpc("place_order", {
        p_seller_id: userId,
        p_buyer_name: buyerName.trim(),
        p_buyer_whatsapp: buyerPhone.trim().replace(/\D/g, ""),
        p_total_value: cartValue,
        p_items: cart.map((c) => ({
          sticker_id: c.id,
          sticker_code: c.code,
          sticker_name: c.name,
          quantity: c.qty,
          unit_price: c.price,
        })),
      });
      if (error) throw error;

      await dbReleaseAll(sessionId);
      qc.invalidateQueries({ queryKey: ["cart-reservations"] });
      qc.invalidateQueries({ queryKey: ["extras-public", userId] });
      clearAllTimers();

      const shortId = String(orderId).slice(0, 8).toUpperCase();
      const lines = cart.map((c) => `• ${fmtCode(c.code)} — ${c.name.split(" — ")[0]} (${c.qty}x)`);
      const msg = [
        `#pedido-extras ${cartCount} figurinhas`,
        ``,
        `⭐ *Pedido de Figurinhas EXTRAS — Copa 2026*`,
        ``,
        `👤 *Nome:* ${buyerName.trim()}`,
        `📱 *WhatsApp:* ${buyerPhone.trim()}`,
        `📍 *Cidade:* ${buyerCity.trim()}`,
        ``,
        `🧾 *Itens:*`,
        ...lines,
        ``,
        `🔢 *Total:* ${cartCount} extra${cartCount !== 1 ? "s" : ""}`,
        `💰 *Valor: ${brl(cartValue)}*`,
        ``,
        `🔖 Pedido: #${shortId}`,
      ].join("\n");

      setWaUrl(`https://wa.me/${EXTRAS_PHONE}?text=${encodeURIComponent(msg)}`);
      setCart([]); setCartOpen(false); setBuyerName(""); setBuyerPhone(""); setBuyerCity("");
    } catch (e: any) {
      toast.error("Erro ao registrar pedido: " + (e?.message ?? String(e)));
    } finally {
      setSending(false);
    }
  };

  const sellerName = seller?.display_name ?? "Vendedor";

  return (
    <div style={{ minHeight: "100dvh", background: "#0B1020" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 h-14 flex items-center justify-between"
        style={{ background: "rgba(11,16,32,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(167,139,250,0.15)" }}>
            <Star className="h-4 w-4" style={{ color: "#A78BFA" }} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: "#FFFFFF" }}>Figurinhas Extras</div>
            <div className="text-[10px] truncate" style={{ color: "#A1A1AA" }}>de {sellerName}</div>
          </div>
        </div>
        <button onClick={() => setCartOpen(true)} className="relative h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}>
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "#A78BFA", color: "#fff" }}>{cartCount}</span>
          )}
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#71717A" }} />
          <Input className="pl-9" placeholder="Buscar jogador, país ou raridade (ex: Messi, Ouro)"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="text-sm py-10 text-center" style={{ color: "#71717A" }}>Carregando extras...</div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
            <Star className="h-8 w-8 mx-auto mb-3" style={{ color: "#52525B" }} />
            <p style={{ color: "#A1A1AA" }}>Nenhuma figurinha extra disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-28">
            {visible.map((s) => {
              const color = getRarityColor(s.code);
              const player = s.name.split(" — ")[0];
              const rar = rarityLabel[getRarityKey(s.code)] ?? s.name.split(" — ")[1] ?? "";
              const avail = availableQty(s);
              return (
                <div key={s.id} className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}55` }}>
                  {/* Foto */}
                  <div className="relative aspect-square flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${color}22, rgba(0,0,0,0.3))` }}>
                    {s.image_url ? (
                      <img src={s.image_url} alt={player} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Camera className="h-8 w-8" style={{ color: color + "88" }} />
                    )}
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: color, color: "#0B1020" }}>{rar}</span>
                  </div>
                  {/* Info */}
                  <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                    <div className="text-[10px] font-mono font-bold" style={{ color }}>{fmtCode(s.code)}</div>
                    <div className="text-[12px] font-semibold leading-tight" style={{ color: "#E4E4E7" }}>{player}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      {Number(s.price) > 0
                        ? <span className="text-sm font-bold" style={{ color: "#FFFFFF" }}>{brl(s.price)}</span>
                        : <span className="text-[11px]" style={{ color: "#A78BFA" }}>a combinar</span>}
                      <span className="text-[10px]" style={{ color: avail > 0 ? "#22C55E" : "#EF4444" }}>
                        {avail > 0 ? `${avail} disp.` : "esgotada"}
                      </span>
                    </div>

                    {/* Botões */}
                    <div className="grid grid-cols-2 gap-1.5 mt-auto pt-1">
                      <button onClick={() => addToCart(s)} disabled={avail <= 0}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40"
                        style={{ background: "rgba(167,139,250,0.18)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.3)" }}>
                        <Plus className="h-3 w-3" /> Quero
                      </button>
                      <a href={negotiateUrl(s)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                        style={{ background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}>
                        <MessageCircle className="h-3 w-3" /> Negociar
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Barra do carrinho */}
      {cartCount > 0 && !cartOpen && !waUrl && (
        <button onClick={() => setCartOpen(true)}
          className="fixed bottom-4 inset-x-4 max-w-4xl mx-auto z-30 flex items-center justify-between px-5 py-3.5 rounded-2xl shadow-lg"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #A78BFA)", color: "#fff" }}>
          <span className="font-bold">{cartCount} extra{cartCount !== 1 ? "s" : ""}</span>
          <span className="flex items-center gap-2 font-bold">{brl(cartValue)} <ShoppingCart className="h-4 w-4" /></span>
        </button>
      )}

      {/* Drawer do carrinho */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setCartOpen(false)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 max-h-[85vh] overflow-y-auto"
            style={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold" style={{ color: "#FFFFFF" }}>Seu pedido de extras</h2>
              <button onClick={() => setCartOpen(false)} style={{ color: "#71717A" }}><X className="h-5 w-5" /></button>
            </div>

            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: "#71717A" }}>Carrinho vazio.</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map((c) => {
                    const color = getRarityColor(c.code);
                    return (
                      <div key={c.id} className="flex items-center gap-2 p-2 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33` }}>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-mono font-bold" style={{ color }}>{fmtCode(c.code)}</div>
                          <div className="text-[12px] truncate" style={{ color: "#E4E4E7" }}>{c.name.split(" — ")[0]}</div>
                          <div className="text-[11px]" style={{ color: "#71717A" }}>{brl(c.price)} un.</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => changeQty(c.id, -1)} className="h-7 w-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}><Minus className="h-3 w-3" /></button>
                          <span className="font-bold w-5 text-center" style={{ color: "#fff" }}>{c.qty}</span>
                          <button onClick={() => changeQty(c.id, +1)} className="h-7 w-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(167,139,250,0.18)", color: "#A78BFA" }}><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "#A1A1AA" }}>Total</span>
                  <span className="text-xl font-black" style={{ color: "#FFFFFF" }}>{brl(cartValue)}</span>
                </div>

                <div className="space-y-2">
                  <Input placeholder="Seu nome" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                  <Input placeholder="Seu WhatsApp (com DDD)" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
                  <Input placeholder="Sua cidade" value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} />
                  <Button onClick={sendOrder} disabled={sending} className="w-full"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #A78BFA)", color: "#fff" }}>
                    <Send className="h-4 w-4" /> {sending ? "Enviando..." : "Enviar pedido pelo WhatsApp"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pós-pedido: link WhatsApp */}
      {waUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#FFFFFF" }}>Pedido reservado!</h2>
            <p className="text-sm mb-5" style={{ color: "#A1A1AA" }}>Toque abaixo para enviar no WhatsApp e combinar o pagamento.</p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold mb-2"
              style={{ background: "#25D366", color: "#fff", textDecoration: "none" }}>
              <MessageCircle className="h-5 w-5" /> Abrir WhatsApp
            </a>
            <button onClick={() => setWaUrl(null)} className="text-sm" style={{ color: "#71717A" }}>Fechar</button>
          </div>
        </div>
      )}

      {/* Modal de inatividade */}
      {inactiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-4xl mb-3">⏰</div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#FFFFFF" }}>Ainda está aí?</h2>
            <p className="text-sm mb-5" style={{ color: "#A1A1AA" }}>
              Suas reservas serão liberadas em <strong style={{ color: "#A78BFA" }}>{confirmSecs}s</strong> por inatividade.
            </p>
            <Button onClick={resetInactivity} className="w-full"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #A78BFA)", color: "#fff" }}>
              Continuar comprando
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

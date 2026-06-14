import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Sticker, Search, ShoppingCart, Plus, Minus, X, Send, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl, fmtCode, fmtName, stickerPrice, discountedPrice, discountLabel } from "@/lib/format";
import { flagUrl, getAllSections } from "@/lib/copa2026Data";

// Mapa teamCode → posição no álbum (calculado uma vez no módulo)
// EXT = -1 para aparecer sempre no topo
const ALBUM_ORDER = new Map<string, number>([
  ["EX", -1],
  ["EXT", -1],
  ...getAllSections().map((s, i) => [s.teamCode, i] as [string, number]),
]);

// Número da figurinha dentro do time (ordena 1,2...10,11 em vez de 1,10,11...2)
function stickerSortNum(code: string): number {
  if (code === "00") return 0;
  const m = code.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 999;
}
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

// ─── Constantes ────────────────────────────────────────────────────────────────
const SELLER_PHONE   = "5515991460543"; // WhatsApp do vendedor (fallback)
const INACTIVITY_MS  = 15 * 60 * 1000; // 15 min sem interação → modal
const CONFIRM_MS     =  2 * 60 * 1000; //  2 min para confirmar → libera reservas

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type CartItem = {
  id:     string;
  code:   string;
  name:   string;
  team:   string;
  price:  number;
  qty:    number;
  maxQty: number;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getSessionId(): string {
  let id = sessionStorage.getItem("catalog_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("catalog_session_id", id);
  }
  return id;
}

function teamCodeFromSticker(code: string | null): string {
  if (!code) return "";
  if (code === "00" || code.startsWith("FWC")) return "INTRO";
  const m = code.match(/^([A-Z]{2,3})/);
  return m ? m[1] : "";
}

// Usa `as any` para tabela dinâmica não tipada no schema gerado
const db = supabase as any;

async function dbReserve(sessionId: string, stickerId: string, qty: number) {
  const expires = new Date(Date.now() + INACTIVITY_MS + CONFIRM_MS + 60_000).toISOString();
  await db.from("cart_reservations").upsert(
    { session_id: sessionId, sticker_id: stickerId, quantity: qty, expires_at: expires },
    { onConflict: "session_id,sticker_id" }
  );
}

async function dbRelease(sessionId: string, stickerId: string) {
  await db.from("cart_reservations")
    .delete()
    .eq("session_id", sessionId)
    .eq("sticker_id", stickerId);
}

async function dbReleaseAll(sessionId: string) {
  await db.from("cart_reservations").delete().eq("session_id", sessionId);
}

async function fetchReservedMap(): Promise<Map<string, number>> {
  const now = new Date().toISOString();
  const { data } = await db.from("cart_reservations")
    .select("sticker_id, quantity")
    .gt("expires_at", now);
  const map = new Map<string, number>();
  for (const r of data ?? []) {
    map.set(r.sticker_id, (map.get(r.sticker_id) ?? 0) + r.quantity);
  }
  return map;
}

// ─── Parser de lista de faltantes ──────────────────────────────────────────────
function parseWishlist(text: string): string[] {
  const codes: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const colonMatch = line.match(/^([A-Za-z0-9]{2,5})\s*:\s*(.+)$/);
    if (colonMatch) {
      const team = colonMatch[1].toUpperCase();
      const nums = colonMatch[2].split(",").map((n) => n.trim()).filter(Boolean);
      for (const num of nums) codes.push(`${team}-${num}`);
      continue;
    }
    if (line.includes(",")) {
      for (const part of line.split(",").map((p) => p.trim()).filter(Boolean)) {
        const m = part.match(/^([A-Za-z]{2,5})[-\s]?(\d{1,3}[A-Za-z]?)$/);
        if (m) codes.push(`${m[1].toUpperCase()}-${m[2]}`);
      }
      continue;
    }
    const singleMatch = line.match(/^([A-Za-z]{2,5})[-\s]?(\d{1,3}[A-Za-z]?)$/);
    if (singleMatch) codes.push(`${singleMatch[1].toUpperCase()}-${singleMatch[2]}`);
  }
  return [...new Set(codes)];
}

// ─── Componente ────────────────────────────────────────────────────────────────
const CATALOG_PAUSADO = false; // <- mude para true para pausar o catálogo

function PublicCatalog() {
  if (CATALOG_PAUSADO) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#0B1020",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        gap: "1.5rem",
      }}>
        <div style={{ fontSize: "4rem" }}>📦</div>
        <h1 style={{ color: "#FFFFFF", fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: 800, lineHeight: 1.2 }}>
          Renovando Estoque
        </h1>
        <p style={{ color: "#A1A1AA", fontSize: "clamp(1rem, 3vw, 1.25rem)", maxWidth: 480, lineHeight: 1.6 }}>
          Em breve teremos mais figurinhas disponíveis para você completar seu álbum!
        </p>
        <p style={{ color: "#71717A", fontSize: "1rem" }}>
          Qualquer dúvida entre em contato:
        </p>
        <a
          href="https://wa.me/5515991460543"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(37,211,102,0.15)",
            color: "#25D366",
            border: "1px solid rgba(37,211,102,0.35)",
            borderRadius: "1rem",
            padding: "0.75rem 1.5rem",
            fontWeight: 700,
            fontSize: "1.1rem",
            textDecoration: "none",
          }}
        >
          📲 (15) 99146-0543
        </a>
      </div>
    );
  }
  const { userId } = Route.useParams();
  const qc         = useQueryClient();
  const sessionId  = useRef(getSessionId()).current;

  const [search,    setSearch]    = useState("");
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [wishlistText, setWishlistText] = useState("");
  const [wishlistResult, setWishlistResult] = useState<{added: string[], notFound: string[]} | null>(null);
  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [cartOpen,  setCartOpen]  = useState(false);
  const [buyerName,  setBuyerName]  = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCity,  setBuyerCity]  = useState("");
  const [sending,   setSending]   = useState(false);
  const [waUrl,     setWaUrl]     = useState<string | null>(null); // após pedido: link WhatsApp

  // Modal de inatividade
  const [inactiveModal, setInactiveModal]   = useState(false);
  const [confirmSecs,   setConfirmSecs]     = useState(0);
  const inactivityTimer  = useRef<ReturnType<typeof setTimeout>>();
  const abandonTimer     = useRef<ReturnType<typeof setTimeout>>();
  const countdownTimer   = useRef<ReturnType<typeof setInterval>>();

  // ── Perfil do vendedor ──────────────────────────────────────────────────────
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

  // ── Figurinhas disponíveis ──────────────────────────────────────────────────
  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ["public-stickers", userId],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("id, code, name, team, quantity, price")
        .eq("user_id", userId)
        .eq("status", "disponivel")
        .gt("quantity", 0)
        .not("code", "like", "EX%") // extras saem para o catálogo dedicado /extras-catalog
        .order("code", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Mapa de reservas ativas (todos usuários) ────────────────────────────────
  const { data: reservedMap = new Map<string, number>() } = useQuery({
    queryKey: ["cart-reservations"],
    refetchInterval: 20_000,
    queryFn: fetchReservedMap,
  });

  // ── Cleanup ao fechar/sair da página ───────────────────────────────────────
  useEffect(() => {
    const release = () => dbReleaseAll(sessionId);
    window.addEventListener("beforeunload", release);
    return () => {
      window.removeEventListener("beforeunload", release);
      release();
    };
  }, [sessionId]);

  // ── Timer de inatividade ───────────────────────────────────────────────────
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
    qc.invalidateQueries({ queryKey: ["public-stickers", userId] });
    toast.info("Reservas liberadas por inatividade. Pode escolher novamente!");
  }, [sessionId, userId, qc, clearAllTimers]);

  const startInactivityTimer = useCallback(() => {
    clearAllTimers();
    inactivityTimer.current = setTimeout(() => {
      // Mostrar modal com contador de 2 minutos
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

  // ── Quantidade disponível para este cliente ─────────────────────────────────
  // avail = total_stock - reservado_por_outros (reservas minhas já compensadas)
  const availableQty = useCallback(
    (s: (typeof stickers)[number]): number => {
      const myQty    = cart.find((c) => c.id === s.id)?.qty ?? 0;
      const reserved = reservedMap.get(s.id) ?? 0;
      return Math.max(0, s.quantity - reserved + myQty);
    },
    [cart, reservedMap]
  );

  // ── Totais ─────────────────────────────────────────────────────────────────
  const totalUnits = useMemo(
    () => stickers.reduce((acc, s) => acc + s.quantity, 0),
    [stickers]
  );
  const cartTotal    = cart.reduce((acc, i) => acc + i.qty, 0);
  // Preço cheio (sem desconto) para mostrar economia
  const cartFull     = cart.reduce((acc, i) => acc + i.qty * i.price, 0);
  // Preço com desconto por volume aplicado
  const _discPct     = cartTotal >= 500 ? 0.15 : cartTotal >= 250 ? 0.10 : cartTotal >= 150 ? 0.05 : 0;
  const cartValue    = cart.reduce((acc, i) => acc + i.qty * i.price * (1 - _discPct), 0);
  const cartDiscount = discountLabel(cartTotal);
  const cartSaving   = cartFull - cartValue;

  // ── Grupos por time ─────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map  = new Map<string, { teamCode: string; items: typeof stickers }>();
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
    // Ordena itens dentro de cada grupo pela posição numérica no álbum (1,2,3...20)
    for (const { items } of map.values()) {
      items.sort((a, b) => stickerSortNum(a.code ?? "") - stickerSortNum(b.code ?? ""));
    }
    // Ordena grupos pela sequência oficial do álbum (Intro → Grupo A → B → ... → L)
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const ai = ALBUM_ORDER.get(a.teamCode) ?? 999;
      const bi = ALBUM_ORDER.get(b.teamCode) ?? 999;
      return ai - bi;
    });
  }, [stickers, search]);

  // ── Ações do carrinho ───────────────────────────────────────────────────────
  const addToCart = async (s: (typeof stickers)[number]) => {
    const avail    = availableQty(s);
    const existing = cart.find((c) => c.id === s.id);

    if (existing) {
      if (existing.qty >= avail) {
        toast.warning("Quantidade máxima disponível atingida");
        return;
      }
      const newQty = existing.qty + 1;
      setCart((prev) =>
        prev.map((c) => (c.id === s.id ? { ...c, qty: newQty } : c))
      );
      await dbReserve(sessionId, s.id, newQty);
    } else {
      if (avail <= 0) {
        toast.warning("Figurinha indisponível no momento");
        return;
      }
      setCart((prev) => [
        ...prev,
        {
          id:     s.id,
          code:   s.code ?? "",
          name:   s.name,
          team:   s.team ?? "",
          price:  s.price ? Number(s.price) : stickerPrice(s.code),
          qty:    1,
          maxQty: avail,
        },
      ]);
      await dbReserve(sessionId, s.id, 1);
    }
    qc.invalidateQueries({ queryKey: ["cart-reservations"] });
    toast.success(`${fmtCode(s.code)} adicionada ao carrinho!`);
  };

  // ── Processar lista colada ─────────────────────────────────────────────────
  const handleWishlist = async () => {
    const wishCodes = parseWishlist(wishlistText);
    if (wishCodes.length === 0) { toast.error("Nenhum código reconhecido na lista."); return; }

    // Mapa de stickers disponíveis — normalizado sem separadores (MEX2, FWC00, etc.)
    const normalize = (c: string) => c.toUpperCase().replace(/[-\s]/g, "").trim();
    const byCode = new Map(
      stickers.map((s) => [normalize(s.code ?? ""), s])
    );

    const added: string[] = [];
    const notFound: string[] = [];

    for (const rawCode of wishCodes) {
      const code = normalize(rawCode);
      const s = byCode.get(code);
      if (!s) { notFound.push(rawCode); continue; }
      const available = (s.quantity ?? 0) - (reservedMap.get(s.id) ?? 0);
      if (available <= 0) { notFound.push(rawCode); continue; }
      const alreadyInCart = cart.find((c) => c.id === s.id);
      if (!alreadyInCart) {
        await addToCart(s);
        added.push(code);
      } else {
        added.push(code); // já estava no carrinho, conta como ok
      }
    }

    setWishlistResult({ added, notFound });
  };

  const removeFromCart = async (id: string) => {
    setCart((p) => p.filter((c) => c.id !== id));
    await dbRelease(sessionId, id);
    qc.invalidateQueries({ queryKey: ["cart-reservations"] });
  };

  const changeQty = async (id: string, delta: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    const newQty = Math.max(1, Math.min(item.maxQty, item.qty + delta));
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, qty: newQty } : c))
    );
    await dbReserve(sessionId, id, newQty);
    qc.invalidateQueries({ queryKey: ["cart-reservations"] });
  };

  // ── Envio do pedido ─────────────────────────────────────────────────────────
  // Usa RPC place_order (SECURITY DEFINER) para criar pedido + dar baixa no estoque
  // atomicamente — cliente anon não tem permissão de UPDATE direto na tabela stickers.
  const sendOrder = async () => {
    if (!buyerName.trim())  { toast.error("Digite seu nome"); return; }
    if (!buyerPhone.trim()) { toast.error("Digite seu WhatsApp"); return; }
    if (!buyerCity.trim())  { toast.error("Digite sua cidade"); return; }
    if (cart.length === 0)  { toast.error("Carrinho vazio"); return; }

    setSending(true);
    try {
      const { data: orderId, error } = await (supabase as any).rpc("place_order", {
        p_seller_id:      userId,
        p_buyer_name:     buyerName.trim(),
        p_buyer_whatsapp: buyerPhone.trim().replace(/\D/g, ""),
        p_total_value:    cartValue,
        p_items: cart.map((c) => ({
          sticker_id:   c.id,
          sticker_code: c.code,
          sticker_name: c.name,
          quantity:     c.qty,
          unit_price:   c.price * (1 - _discPct), // preço com desconto
        })),
      });
      if (error) throw error;

      await dbReleaseAll(sessionId);
      qc.invalidateQueries({ queryKey: ["cart-reservations"] });
      qc.invalidateQueries({ queryKey: ["public-stickers", userId] });
      clearAllTimers();

      // Monta link WhatsApp — exibido como botão <a> para funcionar em qualquer celular
      const sellerPhone = (seller?.whatsapp ?? SELLER_PHONE).replace(/\D/g, "");
      const totalQty   = cart.reduce((sum, c) => sum + c.qty, 0);
      const shortId    = String(orderId).slice(0, 8).toUpperCase();
      const isTatui    = buyerCity.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") === "tatui";
      const msg = [
        `#pedido ${totalQty} figurinhas`,
        ``,
        `📦 *Pedido de Figurinhas Copa 2026*`,
        ``,
        `👤 *Nome:* ${buyerName.trim()}`,
        `📱 *WhatsApp:* ${buyerPhone.trim()}`,
        `📍 *Cidade:* ${buyerCity.trim()}${!isTatui ? " _(frete a combinar)_" : ""}`,
        ``,
        `🔢 *Quantidade:* ${totalQty} figurinha${totalQty !== 1 ? "s" : ""}`,
        `💰 *Total: ${brl(cartValue)}*`,
        ``,
        `🔖 Pedido: #${shortId}`,
      ].join("\n");

      setWaUrl(`https://wa.me/55${sellerPhone}?text=${encodeURIComponent(msg)}`);
      setCart([]); setCartOpen(false); setBuyerName(""); setBuyerPhone(""); setBuyerCity("");
    } catch (e: any) {
      toast.error("Erro ao registrar pedido: " + (e?.message ?? String(e)));
    } finally {
      setSending(false);
    }
  };

  const sellerName = seller?.display_name ?? "Vendedor";


  // ── SEO dinâmico por vendedor ─────────────────────────────────────────────
  useEffect(() => {
    const name    = seller?.display_name ?? null;
    const title   = name
      ? `Figurinhas de ${name} — Compre avulsas | Figu`
      : "Catálogo de figurinhas avulsas | Figu";
    const desc    = name
      ? `Compre figurinhas avulsas diretamente de ${name}. Figurinhas Copa 2026 e outras coleções com entrega rápida via WhatsApp.`
      : "Compre figurinhas avulsas de colecionadores. Catálogo com estoque atualizado, entrega via WhatsApp.";
    const canonical = `https://figu.spiritrelay.com/public-catalog/${userId}`;

    document.title = title;

    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); document.head.appendChild(el); }
      el.setAttribute(attr, val.split(attr === "property" ? "=" : "=")[0]);
      // set correct attribute
      el.setAttribute(attr, sel.includes("property") ? sel.match(/property="([^"]+)"/)![1] : sel.match(/name="([^"]+)"/)![1]);
      el.setAttribute("content", val);
    };

    // helper limpo
    const meta = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        const m = selector.match(/\[(\w+)="([^"]+)"\]/);
        if (m) el.setAttribute(m[1], m[2]);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    meta('meta[name="description"]', desc);
    meta('meta[name="robots"]', "index, follow");
    meta('meta[property="og:title"]', title);
    meta('meta[property="og:description"]', desc);
    meta('meta[property="og:url"]', canonical);
    meta('meta[property="og:type"]', "website");

    let can = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!can) { can = document.createElement("link"); can.setAttribute("rel", "canonical"); document.head.appendChild(can); }
    can.setAttribute("href", canonical);

    // JSON-LD WebPage
    const removeScript = (id: string) => document.getElementById(id)?.remove();
    removeScript("figu-catalog-schema");
    const script = document.createElement("script");
    script.id = "figu-catalog-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": desc,
      "url": canonical,
      "isPartOf": { "@type": "WebSite", "name": "Figu", "url": "https://figu.spiritrelay.com" },
      ...(name ? { "author": { "@type": "Person", "name": name } } : {}),
    });
    document.head.appendChild(script);

    return () => {
      removeScript("figu-catalog-schema");
      document.title = "Figu — Marketplace de figurinhas avulsas";
    };
  }, [seller, userId]);


  // ── Render ──────────────────────────────────────────────────────────────────
  // ── Tela de sucesso com link WhatsApp ────────────────────────────────────────
  if (waUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <Send className="h-9 w-9 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#22C55E" }}>Pedido registrado! ✅</h1>
          <p className="mt-3 text-sm font-medium" style={{ color: "#E4E4E7" }}>
            Agora é só enviar o pedido pelo WhatsApp para receber a chave PIX.
          </p>
          <div className="mt-3 rounded-xl px-4 py-3 text-sm text-left space-y-1"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#A1A1AA" }}>
            <p>1️⃣ Toque em <strong style={{ color: "#fff" }}>Abrir WhatsApp</strong></p>
            <p>2️⃣ <strong style={{ color: "#fff" }}>Envie</strong> a mensagem que já está pronta</p>
            <p>3️⃣ Aguarde a <strong style={{ color: "#fff" }}>chave PIX</strong> chegar</p>
            <p>4️⃣ Pague e envie o comprovante com <strong style={{ color: "#A78BFA" }}>#comprovante</strong></p>
          </div>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm flex items-center justify-center gap-3 text-white font-bold text-lg rounded-2xl py-4 shadow-lg"
          style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.107.549 4.09 1.514 5.813L.057 23.077a.75.75 0 0 0 .92.921l5.355-1.448A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.523-5.157-1.432l-.37-.219-3.828 1.035 1.058-3.744-.24-.386A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          Abrir WhatsApp e enviar pedido
        </a>
        <button
          onClick={() => setWaUrl(null)}
          className="text-sm text-muted-foreground underline"
        >
          Voltar ao catálogo
        </button>
      </div>
    );
  }

  // ── CATÁLOGO EM PAUSA ─────────────────────────────────────────────────────
  const CATALOGO_PAUSADO = false; // mude para false para reabrir

  if (CATALOGO_PAUSADO) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
        style={{ background: "linear-gradient(135deg, #0F0F1A 0%, #1A1033 100%)" }}>
        <div className="text-center space-y-5 max-w-md w-full">

          {/* Foto do estoque */}
          <div className="overflow-hidden rounded-2xl shadow-2xl"
            style={{ border: "2px solid rgba(139,92,246,0.35)" }}>
            <img
              src="/estoque-foto.jpg"
              alt="Novo estoque de figurinhas Copa 2026"
              className="w-full object-cover"
              style={{ maxHeight: "260px" }}
            />
          </div>

          {/* Título */}
          <div>
            <h1 className="text-2xl font-bold text-white">🔄 Estoque em renovação!</h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "#A1A1AA" }}>
              Estamos renovando o estoque com figurinhas novas.<br />
              Temos bastante disponível — <span style={{ color: "#A78BFA", fontWeight: 600 }}>pos 13, FWC e seleções difíceis</span>.<br />
              Em breve o catálogo estará disponível novamente!
            </p>
          </div>

          {/* Destaques */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: "📸", label: "Posição 13" },
              { emoji: "🏆", label: "FWC" },
              { emoji: "🌍", label: "Seleções difíceis" },
            ].map(({ emoji, label }) => (
              <div key={label} className="rounded-xl py-2 px-1 text-center"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <div className="text-xl">{emoji}</div>
                <div className="text-xs mt-1 font-medium" style={{ color: "#A78BFA" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* WhatsApp */}
          {seller?.whatsapp && (
            <a
              href={`https://wa.me/55${seller.whatsapp.replace(/\D/g, "")}?text=Ol%C3%A1!%20Vi%20que%20o%20cat%C3%A1logo%20est%C3%A1%20em%20renova%C3%A7%C3%A3o.%20Quero%20figurinhas%20da%20pos%2013%2C%20FWC%20e%20sele%C3%A7%C3%B5es%20dif%C3%ADceis!`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}
            >
              <span>💬</span> Quero figurinhas — fale comigo!
            </a>
          )}
        </div>
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── Modal de inatividade ── */}
      {inactiveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">Ainda está aí?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Suas figurinhas estão reservadas por mais{" "}
                <span className="font-semibold text-amber-600">
                  {Math.floor(confirmSecs / 60)}:{String(confirmSecs % 60).padStart(2, "0")}
                </span>
                . Depois disso voltam para o estoque.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200"
                onClick={triggerAbandon}
              >
                Liberar carrinho
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setInactiveModal(false);
                  clearTimeout(abandonTimer.current);
                  clearInterval(countdownTimer.current);
                  resetInactivity();
                  toast.success("Ótimo! Suas reservas foram mantidas.");
                }}
              >
                Sim, ainda estou aqui!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-card border-b sticky top-0 z-20 backdrop-blur bg-card/95">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Sticker className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Catálogo — {sellerName}</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{totalUnits}</span> figurinhas em estoque · Copa 2026
            </div>
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
            <span className="hidden sm:inline">
              {cartTotal > 0 ? `${cartTotal} iten${cartTotal > 1 ? "s" : ""}` : "Carrinho"}
            </span>
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* ── Banner informativo ── */}
        <div className="grid grid-cols-1 gap-2">
          {/* Descontos */}
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 text-white font-black text-xs">
              %
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-700 leading-tight">Descontos por volume</div>
              <div className="text-[11px] text-amber-600/90">150→10% · 500→15%</div>
            </div>
          </div>
        </div>

        {/* ── Busca + Botão Wishlist ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar seleção ou código (BRA, MEX, FRA...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setWishlistOpen(true); setWishlistResult(null); setWishlistText(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: "rgba(139,92,246,0.15)",
              color: "#A78BFA",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
            title="Colar lista de faltantes"
          >
            📋 Colar lista
          </button>
        </div>

        {/* ── Modal Wishlist ── */}
        {wishlistOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setWishlistOpen(false); }}
          >
            <div
              className="w-full max-w-lg rounded-2xl p-5 space-y-4"
              style={{ background: "#0F1629", border: "1px solid rgba(139,92,246,0.3)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: "#E4E4E7" }}>
                  📋 Colar lista de faltantes
                </h2>
                <button onClick={() => setWishlistOpen(false)} style={{ color: "#71717A" }}>✕</button>
              </div>

              <p className="text-xs" style={{ color: "#A1A1AA" }}>
                Cole sua lista no formato do app de álbum. Exemplos aceitos:
                <br />
                <span style={{ color: "#A78BFA", fontFamily: "monospace" }}>
                  FWC: 00, 2, 3, 4 &nbsp;·&nbsp; BRA: 16 &nbsp;·&nbsp; GHA-3 &nbsp;·&nbsp; GHA2
                </span>
              </p>

              <textarea
                className="w-full rounded-xl p-3 text-sm resize-none"
                rows={8}
                placeholder={"FWC: 00, 2, 3, 4\nBRA: 16\nMEX: 1, 2, 3\nGHA-3"}
                value={wishlistText}
                onChange={(e) => setWishlistText(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#E4E4E7",
                  outline: "none",
                  fontFamily: "monospace",
                }}
              />

              {wishlistResult && (
                <div className="rounded-xl p-3 space-y-1 text-xs"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p style={{ color: "#22C55E" }}>
                    ✅ {wishlistResult.added.length} figurinha{wishlistResult.added.length !== 1 ? "s" : ""} adicionada{wishlistResult.added.length !== 1 ? "s" : ""} ao carrinho
                  </p>
                  {wishlistResult.notFound.length > 0 && (
                    <p style={{ color: "#F59E0B" }}>
                      ⚠️ Não encontradas ({wishlistResult.notFound.length}): {wishlistResult.notFound.slice(0, 10).join(", ")}{wishlistResult.notFound.length > 10 ? "..." : ""}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleWishlist}
                  disabled={!wishlistText.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                    color: "#fff",
                  }}
                >
                  Adicionar ao carrinho
                </button>
                {wishlistResult && (
                  <button
                    onClick={() => setWishlistOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" }}
                  >
                    Ver carrinho
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Carregando catálogo...</div>
        ) : stickers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sticker className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma figurinha disponível no momento.</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum resultado para "{search}".
          </div>
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
                    <span className="text-xs text-muted-foreground ml-auto">
                      {items.length} tipo{items.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {items.map((s) => {
                      const inCart = cart.find((c) => c.id === s.id);
                      const avail  = availableQty(s);
                      const price  = s.price ? Number(s.price) : stickerPrice(s.code);
                      const esgotado = avail <= 0 && !inCart;

                      return (
                        <div
                          key={s.id}
                          className={`flex items-center gap-2 py-2 px-2 rounded-lg transition-colors ${
                            esgotado
                              ? "opacity-50 bg-muted/30"
                              : inCart
                              ? "bg-green-50 dark:bg-green-950/20"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          {/* Código */}
                          <span className={`font-mono text-xs font-bold px-2 py-1 rounded w-16 text-center shrink-0 ${
                            inCart
                              ? "bg-green-100 text-green-700"
                              : esgotado
                              ? "bg-muted text-muted-foreground/60"
                              : "bg-muted text-foreground"
                          }`}>
                            {fmtCode(s.code)}
                          </span>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{fmtName(s.name)}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {(() => {
                                const dprice = (s.price ? Number(s.price) : stickerPrice(s.code)) * (1 - _discPct);
                                return (
                                  <>
                                    <span className="text-xs font-bold text-green-700">{brl(dprice)}</span>
                                    {dprice < price && (
                                      <span className="text-[10px] line-through text-muted-foreground/60">{brl(price)}</span>
                                    )}
                                  </>
                                );
                              })()}
                              <span className="text-xs text-muted-foreground">
                                {esgotado
                                  ? "Indisponível"
                                  : `${Math.max(0, s.quantity - (reservedMap.get(s.id) ?? 0))} disp.`}
                              </span>
                            </div>
                          </div>

                          {/* Controles */}
                          {inCart ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                                onClick={() =>
                                  inCart.qty === 1
                                    ? removeFromCart(s.id)
                                    : changeQty(s.id, -1)
                                }
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-black text-green-700">
                                {inCart.qty}
                              </span>
                              <button
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 disabled:opacity-30"
                                disabled={inCart.qty >= avail}
                                onClick={() => changeQty(s.id, 1)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled={esgotado}
                              onClick={() => addToCart(s)}
                              className="h-8 px-3 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* ── Carrinho — bottom sheet ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/30" onClick={() => setCartOpen(false)} />
          <div className="rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col" style={{ background: "#0F1629", borderTop: "1px solid rgba(139,92,246,0.2)" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">
                Carrinho · {cartTotal} figurinha{cartTotal !== 1 ? "s" : ""}
                {cartValue > 0 && (
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    · {brl(cartValue)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Aviso de reserva */}
            {cart.length > 0 && (
              <div className="mx-4 mt-3 mb-1 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Reservadas por <strong>15 min</strong>. Sem atividade, voltam automaticamente ao estoque — conclua o pedido para garantir.
                </span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Carrinho vazio
                </div>
              ) : (
                [...cart].sort((a, b) => a.code.localeCompare(b.code)).map((item) => {
                  const teamCode = teamCodeFromSticker(item.code);
                  const flag     = flagUrl(teamCode);
                  const unitPrice = item.price * (1 - _discPct);
                  const subtotal  = unitPrice * item.qty;
                  return (
                    <div
                      key={item.id}
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem" }}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      {/* Bandeira + código */}
                      <div className="flex flex-col items-center gap-1 shrink-0 w-12">
                        {flag
                          ? <img src={flag} alt={teamCode} className="w-7 h-5 object-cover rounded-sm" />
                          : <div className="w-7 h-5 rounded-sm bg-muted/60" />
                        }
                        <span
                          className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-center leading-none"
                          style={{ background: "rgba(139,92,246,0.2)", color: "#C4B5FD" }}
                        >
                          {fmtCode(item.code)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate leading-tight">
                          {fmtName(item.name)}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "#71717A" }}>
                          {brl(unitPrice)} × {item.qty}
                          {" = "}
                          <span className="font-bold" style={{ color: "#4ADE80" }}>
                            {brl(subtotal)}
                          </span>
                        </div>
                      </div>

                      {/* Controles de quantidade */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#F87171" }}
                          onClick={() => item.qty === 1 ? removeFromCart(item.id) : changeQty(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">{item.qty}</span>
                        <button
                          className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                          style={{ background: "rgba(34,197,94,0.12)", color: "#4ADE80" }}
                          disabled={item.qty >= item.maxQty}
                          onClick={() => changeQty(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          className="h-7 w-7 flex items-center justify-center rounded-lg ml-0.5 transition-colors"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#F87171" }}
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-4 py-4 border-t space-y-3">
                {/* Total */}
                {cartValue > 0 && (
                  <div className="space-y-1.5">
                    {/* Badge de desconto */}
                    {cartDiscount && (
                      <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-1.5">
                        <span className="text-xs font-bold text-green-700">
                          🎉 {cartDiscount.label}
                        </span>
                        <span className="text-xs font-semibold text-green-600">
                          −{brl(cartSaving)}
                        </span>
                      </div>
                    )}
                    {/* Próxima faixa */}
                    {cartTotal < 150 && (
                      <p className="text-[11px] text-center text-muted-foreground">
                        Mais {150 - cartTotal} figurinha{150 - cartTotal !== 1 ? "s" : ""} para ganhar 10% de desconto
                      </p>
                    )}
                    {cartTotal >= 150 && cartTotal < 500 && (
                      <p className="text-[11px] text-center text-muted-foreground">
                        Mais {500 - cartTotal} figurinha{500 - cartTotal !== 1 ? "s" : ""} para 15% de desconto
                      </p>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm text-muted-foreground">
                        {cartTotal} figurinha{cartTotal !== 1 ? "s" : ""}
                        {cartDiscount && <span className="ml-1 text-[10px] line-through text-muted-foreground/50">{brl(cartFull)}</span>}
                      </span>
                      <span className="text-lg font-black text-green-700">{brl(cartValue)}</span>
                    </div>
                  </div>
                )}

                <Input
                  placeholder="Seu nome *"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
                <Input
                  placeholder="Seu WhatsApp com DDD * (ex: 15999990000)"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  type="tel"
                />
                <Input
                  placeholder="Sua cidade *"
                  value={buyerCity}
                  onChange={(e) => setBuyerCity(e.target.value)}
                />
                {buyerCity.trim() &&
                  buyerCity.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") !== "tatui" && (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#F59E0B" }}>
                    <span className="text-base leading-none">🚚</span>
                    <span>Entregas fora de Tatuí têm frete a combinar com o vendedor.</span>
                  </div>
                )}
                <Button
                  className="w-full h-12 font-bold bg-green-600 hover:bg-green-700 gap-2 text-base"
                  onClick={sendOrder}
                  disabled={sending}
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Enviando..." : `Enviar pedido — ${brl(cartValue)}`}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Você será redirecionado ao WhatsApp do vendedor para confirmar o PIX.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Espaço para o footer fixo não cobrir conteúdo */}
      <div className="h-10" />

      {/* Footer fixo */}
      <footer className="fixed bottom-0 left-0 right-0 backdrop-blur border-t py-2 text-center text-[10px] z-10"
        style={{ background: "rgba(11,16,32,0.85)", borderColor: "rgba(255,255,255,0.06)", color: "#71717A" }}>
        Desenvolvido por{" "}
        <a
          href="https://spiritrelay.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#A78BFA", textDecoration: "none" }}
        >
          SpiritRelay
        </a>
        {" "}·{" "}
        <a
          href="mailto:contato@spiritrelay.com"
          style={{ color: "#71717A", textDecoration: "none" }}
        >
          contato@spiritrelay.com
        </a>
      </footer>
    </div>
  );
}

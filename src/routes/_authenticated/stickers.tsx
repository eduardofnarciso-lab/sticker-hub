import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Tag, X, Percent, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StickerFormDialog, type StickerInput } from "@/components/StickerFormDialog";
import { brl, conditionLabel, statusLabel, fmtCode, fmtName, isPromoActive, type SellerPricing } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/stickers")({
  component: StickersPage,
});

// Modal de configuracao de preco
function PricingModal({ pricing, onClose }: { pricing: SellerPricing; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [basePrice, setBasePrice] = useState(pricing.base_price.toFixed(2));
  const [promoOn,   setPromoOn]   = useState(pricing.promo_pct > 0);
  const [promoPct,  setPromoPct]  = useState(pricing.promo_pct.toString());
  const [promoDate, setPromoDate] = useState(
    pricing.promo_expires_at ? pricing.promo_expires_at.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  const base    = Math.max(0.01, parseFloat(basePrice) || 1);
  const pct     = Math.min(90, Math.max(0, parseInt(promoPct) || 0));
  const special = base * 2;
  const promo   = promoOn && pct > 0 ? Math.round(base * (1 - pct / 100) * 100) / 100 : null;
  const promoSp = promoOn && pct > 0 ? Math.round(special * (1 - pct / 100) * 100) / 100 : null;

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          base_price:       base,
          promo_pct:        promoOn ? pct : 0,
          promo_expires_at: promoOn && promoDate ? new Date(promoDate).toISOString() : null,
        })
        .eq("id", user.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["seller-pricing", user.id] });
      toast.success("Preco atualizado! O catalogo publico ja reflete o novo valor.");
      onClose();
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: "#0F1629", border: "1px solid rgba(139,92,246,0.3)" }}>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Configurar Preco</h2>
            <p className="text-xs mt-0.5" style={{ color: "#71717A" }}>Valido para todo o seu catalogo publico</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-violet-400" />
            Preco base por figurinha
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: "#A1A1AA" }}>R$</span>
            <Input
              type="number" min="0.10" step="0.10"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="pl-9 text-white font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div className="flex gap-3 text-xs" style={{ color: "#A1A1AA" }}>
            <span>Normal: <strong className="text-white">{brl(base)}</strong></span>
            <span>Especial (FWC/Logo): <strong className="text-white">{brl(special)}</strong></span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        <div className="space-y-3">
          <button onClick={() => setPromoOn((v) => !v)}
            className="flex items-center justify-between w-full">
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-amber-400" />
              Promocao
            </span>
            <div className="flex items-center gap-2">
              {promoOn && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>ATIVA</span>
              )}
              {promoOn ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
            </div>
          </button>

          {promoOn && (
            <div className="space-y-3 pl-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "#A1A1AA" }}>Desconto (%)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={90} value={pct}
                    onChange={(e) => setPromoPct(e.target.value)}
                    className="flex-1 accent-amber-400" />
                  <span className="text-sm font-bold text-amber-400 w-10 text-right">{pct}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#A1A1AA" }}>
                  <Calendar className="h-3 w-3" />
                  Valida ate (opcional)
                </label>
                <Input type="date" value={promoDate}
                  onChange={(e) => setPromoDate(e.target.value)}
                  className="text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                {!promoDate && (
                  <p className="text-[10px]" style={{ color: "#71717A" }}>
                    Sem data = promocao permanente ate voce desativar
                  </p>
                )}
              </div>

              {pct > 0 && promo !== null && (
                <div className="rounded-xl p-3 space-y-1"
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p className="text-[11px] font-semibold text-amber-400">Previa do catalogo</p>
                  <div className="flex gap-4 text-xs">
                    <span style={{ color: "#A1A1AA" }}>
                      Normal: <s className="opacity-50">{brl(base)}</s>{" "}
                      <strong className="text-amber-400">{brl(promo)}</strong>
                    </span>
                    <span style={{ color: "#A1A1AA" }}>
                      Especial: <s className="opacity-50">{brl(special)}</s>{" "}
                      <strong className="text-amber-400">{brl(promoSp!)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 font-bold"
            style={{ background: "linear-gradient(135deg,#8B5CF6,#60A5FA)" }}>
            {saving ? "Salvando..." : "Salvar preco"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Pagina principal
function StickersPage() {
  const { user }  = useAuth();
  const [open,        setOpen]        = useState(false);
  const [editing,     setEditing]     = useState<StickerInput | null>(null);
  const [pricingOpen, setPricingOpen] = useState(false);

  const { data: pricing } = useQuery<SellerPricing>({
    queryKey: ["seller-pricing", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("base_price, promo_pct, promo_expires_at")
        .eq("id", user!.id)
        .single();
      return {
        base_price:       data?.base_price       ?? 1.00,
        promo_pct:        data?.promo_pct        ?? 0,
        promo_expires_at: data?.promo_expires_at ?? null,
      };
    },
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["stickers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("*, albums(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const promoAtiva = pricing ? isPromoActive(pricing) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Figurinhas</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre e edite as figurinhas do seu acervo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPricingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: promoAtiva ? "rgba(245,158,11,0.15)" : "rgba(139,92,246,0.15)",
              border:     promoAtiva ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(139,92,246,0.3)",
              color:      promoAtiva ? "#F59E0B" : "#C4B5FD",
            }}>
            <Tag className="h-4 w-4" />
            {pricing ? brl(pricing.base_price) : "Preco"}
            {promoAtiva && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5"
                style={{ background: "rgba(245,158,11,0.2)", color: "#FCD34D" }}>
                -{pricing!.promo_pct}%
              </span>
            )}
          </button>

          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            Nova
          </Button>
        </div>
      </div>

      {promoAtiva && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }}>
          <Percent className="h-4 w-4 shrink-0" />
          <span>
            Promocao de <strong>{pricing!.promo_pct}%</strong> ativa no seu catalogo publico
            {pricing!.promo_expires_at && (
              <> — valida ate <strong>{new Date(pricing!.promo_expires_at).toLocaleDateString("pt-BR")}</strong></>
            )}
          </span>
          <button className="ml-auto text-xs underline opacity-70 hover:opacity-100"
            onClick={() => setPricingOpen(true)}>Editar</button>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : data.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-muted-foreground">Nenhuma figurinha cadastrada.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Cadastrar
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <Card key={s.id} className="p-3 shadow-card overflow-hidden">
              <div className="flex gap-3">
                <div className="h-20 w-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">sem foto</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {s.code && <div className="text-[11px] text-muted-foreground">#{fmtCode(s.code)}</div>}
                      <div className="font-semibold truncate text-sm">{fmtName(s.name)}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.albums?.name ?? "Sem album"}{s.team ? ` - ${s.team}` : ""}
                      </div>
                    </div>
                    <Badge variant={s.status === "disponivel" ? "default" : "secondary"} className="text-[10px]">
                      {statusLabel[s.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-muted-foreground">{conditionLabel[s.condition]} - {s.quantity}un</span>
                    <span className="font-semibold">{brl(s.price)}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="w-full mt-2"
                onClick={() => {
                  setEditing({
                    id: s.id, name: s.name, code: s.code, album_id: s.album_id,
                    team: s.team, rarity: s.rarity, condition: s.condition,
                    quantity: s.quantity, price: Number(s.price),
                    image_url: s.image_url, notes: s.notes, status: s.status,
                  });
                  setOpen(true);
                }}>
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            </Card>
          ))}
        </div>
      )}

      <StickerFormDialog open={open} onOpenChange={setOpen} initial={editing} />
      {pricingOpen && pricing && (
        <PricingModal pricing={pricing} onClose={() => setPricingOpen(false)} />
      )}
    </div>
  );
}

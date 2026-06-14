import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useRef } from "react";
import { Plus, Minus, Pencil, Share2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { StickerFormDialog, type StickerInput } from "@/components/StickerFormDialog";
import { EXTRAS, getRarityColor, getRarityKey, rarityLabel } from "@/lib/extrasData";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/estoque-extras")({
  component: EstoqueExtrasPage,
});

type DbExtra = {
  id: string;
  code: string;
  quantity: number;
  price: number;
  image_url: string | null;
};

// Miniatura: foto do banco; senão /public/<codigo>.png; senão ícone
function ExtraThumb({ code, imageUrl, alt, color }: { code: string; imageUrl: string | null; alt: string; color: string }) {
  const src = imageUrl ?? `/${code}.png`;
  const [err, setErr] = useState(false);
  if (err) return <Camera className="h-5 w-5" style={{ color: color + "99" }} />;
  return <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" onError={() => setErr(true)} />;
}

function EstoqueExtrasPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StickerInput | null>(null);
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Extras já cadastradas pelo usuário
  const { data: dbExtras = [] } = useQuery({
    queryKey: ["extras-stock", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("id, code, quantity, price, image_url")
        .eq("user_id", user!.id)
        .like("code", "EX%");
      if (error) throw error;
      return (data ?? []) as DbExtra[];
    },
  });

  const dbMap = useMemo(() => {
    const m = new Map<string, DbExtra>();
    for (const e of dbExtras) m.set(e.code, e);
    return m;
  }, [dbExtras]);

  const getQty = useCallback(
    (code: string) => {
      if (code in localQty) return localQty[code];
      return dbMap.get(code)?.quantity ?? 0;
    },
    [localQty, dbMap]
  );

  // Salva/atualiza quantidade (debounce 600ms)
  const persist = useCallback(
    async (code: string, name: string, newQty: number) => {
      if (!user?.id) return;
      setSaving((p) => new Set(p).add(code));
      try {
        const existing = dbMap.get(code);
        if (existing) {
          const { error } = await supabase
            .from("stickers")
            .update({ quantity: newQty })
            .eq("id", existing.id)
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("stickers").upsert(
            {
              code,
              name,
              team: "Extra",
              quantity: newQty,
              status: "disponivel",
              condition: "nova",
              price: 5,
              user_id: user.id,
            },
            { onConflict: "code,user_id" }
          );
          if (error) throw error;
        }
        qc.invalidateQueries({ queryKey: ["extras-stock", user.id] });
        qc.invalidateQueries({ queryKey: ["dashboard-stats", user.id] });
      } catch (e: any) {
        toast.error("Erro ao salvar " + code + ": " + (e?.message ?? String(e)));
      } finally {
        setSaving((p) => {
          const n = new Set(p);
          n.delete(code);
          return n;
        });
      }
    },
    [dbMap, qc, user]
  );

  const adjust = useCallback(
    (code: string, name: string, delta: number) => {
      const next = Math.max(0, getQty(code) + delta);
      setLocalQty((p) => ({ ...p, [code]: next }));
      clearTimeout(timers.current[code]);
      timers.current[code] = setTimeout(() => persist(code, name, next), 600);
    },
    [getQty, persist]
  );

  const totalUnidades = useMemo(
    () => EXTRAS.reduce((acc, e) => acc + getQty(e.code), 0),
    [getQty]
  );
  const totalComFoto = useMemo(
    () => dbExtras.filter((e) => !!e.image_url).length,
    [dbExtras]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return EXTRAS;
    return EXTRAS.filter((e) =>
      [e.code, e.name].join(" ").toLowerCase().includes(term)
    );
  }, [search]);

  const openEdit = (code: string, name: string) => {
    const existing = dbMap.get(code);
    const full = dbExtras.find((e) => e.code === code);
    setEditing({
      id: existing?.id,
      code,
      name,
      album_id: null,
      team: "Extra",
      rarity: rarityLabel[getRarityKey(code)] ?? null,
      condition: "nova",
      quantity: existing?.quantity ?? getQty(code) ?? 1,
      price: full ? Number(full.price) : 5,
      image_url: full?.image_url ?? null,
      notes: null,
      status: "disponivel",
    });
    setOpen(true);
  };

  const shareCatalog = async () => {
    const url = `${window.location.origin}/extras-catalog/${user?.id ?? ""}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link do catálogo de extras copiado!");
    } catch {
      toast.info(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
            Estoque Extras
          </h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>
            <span className="font-semibold" style={{ color: "#A78BFA" }}>{totalUnidades}</span> em estoque ·{" "}
            <span className="font-semibold" style={{ color: "#22D3EE" }}>{totalComFoto}</span>/{EXTRAS.length} com foto
          </p>
        </div>

        <button
          onClick={shareCatalog}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: "rgba(167,139,250,0.12)",
            color: "#A78BFA",
            border: "1px solid rgba(167,139,250,0.25)",
          }}
        >
          <Share2 className="h-4 w-4" />
          Catálogo de extras
        </button>
      </div>

      {/* Busca */}
      <Input
        placeholder="Buscar jogador, país ou código (ex: Messi, Ouro, EX09)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Grade de extras */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pb-8">
        {visible.map((e) => {
          const color = getRarityColor(e.code);
          const qty = getQty(e.code);
          const isSaving = saving.has(e.code);
          const full = dbExtras.find((d) => d.code === e.code);
          const player = e.name.split(" — ")[0];
          const rar = e.name.split(" — ")[1];
          return (
            <div
              key={e.code}
              className="rounded-xl p-2.5 flex flex-col gap-2"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}44` }}
            >
              <div className="flex gap-2">
                {/* Miniatura */}
                <div
                  className="h-14 w-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${color}55` }}
                >
                  <ExtraThumb code={e.code} imageUrl={full?.image_url ?? null} alt={player} color={color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono font-bold" style={{ color }}>{e.code}</div>
                  <div className="text-[11px] leading-tight truncate" style={{ color: "#E4E4E7" }}>{player}</div>
                  <div className="text-[10px] font-bold" style={{ color }}>{rar}</div>
                  {full && (
                    <div className="text-[10px] mt-0.5" style={{ color: "#71717A" }}>{brl(full.price)}</div>
                  )}
                </div>
              </div>

              {/* Steppers */}
              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={() => adjust(e.code, e.name, -1)}
                  disabled={qty === 0 || isSaving}
                  className="h-7 w-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-black text-base" style={{ color: qty > 0 ? "#22D3EE" : "#52525B" }}>{qty}</span>
                <button
                  onClick={() => adjust(e.code, e.name, +1)}
                  disabled={isSaving}
                  className="h-7 w-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "rgba(34,211,238,0.15)", color: "#22D3EE" }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Foto / preço */}
              <button
                onClick={() => openEdit(e.code, e.name)}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.2)" }}
              >
                <Pencil className="h-3 w-3" />
                {full?.image_url ? "Editar foto/preço" : "Adicionar foto/preço"}
              </button>
            </div>
          );
        })}
      </div>

      <StickerFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={() => {
          if (user?.id) {
            qc.invalidateQueries({ queryKey: ["extras-stock", user.id] });
            qc.invalidateQueries({ queryKey: ["dashboard-stats", user.id] });
          }
        }}
      />
    </div>
  );
}

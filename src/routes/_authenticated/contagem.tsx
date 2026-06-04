import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useRef } from "react";
import { Search, RotateCcw, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getAllSections, flagUrl, type StickerTemplate, type TeamSection } from "@/lib/copa2026Data";
import { fmtCode, fmtName } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contagem")({
  component: ContagemPage,
});

// Seções na ordem do álbum físico (Intro → Grupo A → B → ... → L)
const ALL_SECTIONS: TeamSection[] = getAllSections();

type DbSticker = { id: string; code: string; quantity: number };

function ContagemPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Carrega apenas os stickers do usuário logado
  const { data: dbStickers = [] } = useQuery({
    queryKey: ["stickers-contagem", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("id, code, quantity")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as DbSticker[];
    },
  });

  // Mapa rápido: code → {id, quantity}
  const dbMap = useMemo(() => {
    const m = new Map<string, DbSticker>();
    for (const s of dbStickers) m.set(s.code, s);
    return m;
  }, [dbStickers]);

  // Quantidade efetiva: local > banco > 0
  const getQty = useCallback(
    (code: string) => {
      if (code in localQty) return localQty[code];
      return dbMap.get(code)?.quantity ?? 0;
    },
    [localQty, dbMap]
  );

  // Salva/atualiza no banco com debounce 600ms
  const persist = useCallback(
    async (tpl: StickerTemplate, newQty: number) => {
      if (!user?.id) return;
      setSaving((p) => new Set(p).add(tpl.code));
      try {
        const existing = dbMap.get(tpl.code);
        if (existing) {
          const { error } = await supabase
            .from("stickers")
            .update({ quantity: newQty })
            .eq("id", existing.id)
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("stickers")
            .upsert({
              code:      tpl.code,
              name:      tpl.team + " — " + tpl.name,
              team:      tpl.team,
              quantity:  newQty,
              status:    "disponivel",
              condition: "nova",
              price:     0,
              user_id:   user.id,
            }, { onConflict: "code,user_id" });
          if (error) throw error;
        }
        qc.invalidateQueries({ queryKey: ["stickers-contagem", user.id] });
        qc.invalidateQueries({ queryKey: ["dashboard-stats", user.id] });
      } catch (e: any) {
        toast.error("Erro ao salvar " + tpl.code + ": " + (e?.message ?? String(e)));
      } finally {
        setSaving((p) => { const n = new Set(p); n.delete(tpl.code); return n; });
      }
    },
    [dbMap, qc, user]
  );

  const adjust = useCallback(
    (tpl: StickerTemplate, delta: number) => {
      const current = getQty(tpl.code);
      const next    = Math.max(0, current + delta);
      setLocalQty((p) => ({ ...p, [tpl.code]: next }));
      clearTimeout(timers.current[tpl.code]);
      timers.current[tpl.code] = setTimeout(() => persist(tpl, next), 600);
    },
    [getQty, persist]
  );

  // Totais
  const totalEmEstoque = useMemo(() => {
    let sum = 0;
    for (const sec of ALL_SECTIONS)
      for (const t of sec.stickers) sum += getQty(t.code);
    return sum;
  }, [getQty]);

  // Zerar tudo (só os stickers do usuário logado)
  const zeraTudo = async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from("stickers")
        .update({ quantity: 0 })
        .eq("user_id", user.id)
        .gte("quantity", 0);
      setLocalQty({});
      qc.invalidateQueries({ queryKey: ["stickers-contagem", user.id] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats", user.id] });
      toast.success("Estoque zerado!");
    } catch (e) {
      toast.error("Erro: " + String(e));
    }
  };

  // Filtragem por busca — mantém ordem do álbum
  const visibleSections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ALL_SECTIONS;
    return ALL_SECTIONS.map((sec) => ({
      ...sec,
      stickers: sec.stickers.filter((t) =>
        [t.code, t.name, sec.team].join(" ").toLowerCase().includes(term)
      ),
    })).filter((sec) => sec.stickers.length > 0);
  }, [search]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>Figurinhas</h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>
            <span className="font-semibold" style={{ color: "#22D3EE" }}>{totalEmEstoque}</span> em estoque
            · 48 seleções · ordem do álbum
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Zerar tudo
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Zerar todo o estoque?</AlertDialogTitle>
              <AlertDialogDescription>
                Coloca <strong>quantidade = 0</strong> em todas as suas figurinhas. Não pode ser desfeito.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={zeraTudo}>
                Sim, zerar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#71717A" }} />
        <Input
          className="pl-9"
          placeholder="Buscar seleção ou código (ex: BRA, JOR, FRA...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Seção Extras ── */}
      {(() => {
        const extras = [
          { code: "EXT01L",  name: "Vinícius Júnior — Lilás",    color: "#A78BFA" },
          { code: "EXT01BR", name: "Vinícius Júnior — Bronze",   color: "#CD7F32" },
          { code: "EXT01P",  name: "Vinícius Júnior — Prata",    color: "#C0C0C0" },
          { code: "EXT01O",  name: "Vinícius Júnior — Ouro",     color: "#FFD700" },
          { code: "EXT02L",  name: "Moisés Caicedo — Lilás",     color: "#A78BFA" },
          { code: "EXT02BR", name: "Moisés Caicedo — Bronze",    color: "#CD7F32" },
          { code: "EXT02P",  name: "Moisés Caicedo — Prata",     color: "#C0C0C0" },
          { code: "EXT02O",  name: "Moisés Caicedo — Ouro",      color: "#FFD700" },
        ];
        const anyExtra = extras.some((e) => dbMap.has(e.code));
        if (!anyExtra) return null;
        return (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: "#A78BFA" }}>⭐ Extras</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {extras.map((e) => {
                if (!dbMap.has(e.code)) return null;
                const qty = getQty(e.code);
                const tpl = { code: e.code, name: e.name } as StickerTemplate;
                const isSaving = saving.has(e.code);
                return (
                  <div key={e.code} className="rounded-xl p-2.5 flex flex-col gap-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${e.color}44` }}>
                    <div>
                      <div className="text-[10px] font-mono font-bold" style={{ color: e.color }}>{e.code}</div>
                      <div className="text-[11px] leading-tight" style={{ color: "#E4E4E7" }}>
                        {e.name.split(" — ")[0]}
                      </div>
                      <div className="text-[10px] font-bold" style={{ color: e.color }}>
                        {e.name.split(" — ")[1]}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <button onClick={() => adjust(tpl, -1)} disabled={qty === 0 || isSaving}
                        className="h-7 w-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-black text-base" style={{ color: qty > 0 ? "#22D3EE" : "#52525B" }}>{qty}</span>
                      <button onClick={() => adjust(tpl, +1)} disabled={isSaving}
                        className="h-7 w-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: "rgba(34,211,238,0.15)", color: "#22D3EE" }}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Seleções na ordem do álbum */}
      <div className="space-y-6 pb-8">
        {visibleSections.map((sec) => {
          const teamTotal = sec.stickers.reduce((acc, t) => acc + getQty(t.code), 0);
          const isIntro   = sec.group === "Intro";
          const flagSrc   = flagUrl(sec.teamCode, "w40");
          return (
            <div key={sec.team}>
              <div className="flex items-center gap-2 mb-3 pb-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {flagSrc
                  ? <img src={flagSrc} alt={sec.team} className="h-5 w-auto rounded-sm" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
                  : <span className="text-base">🏆</span>
                }
                <span className="font-semibold text-sm" style={{ color: "#E4E4E7" }}>{sec.team}</span>
                {!isIntro && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#71717A" }}>
                    Grupo {sec.group}
                  </span>
                )}
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: teamTotal > 0 ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)",
                    color: teamTotal > 0 ? "#22D3EE" : "#52525B",
                    border: `1px solid ${teamTotal > 0 ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                  {teamTotal} un.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {sec.stickers.map((tpl) => {
                  const q        = getQty(tpl.code);
                  const isSaving = saving.has(tpl.code);
                  return (
                    <div
                      key={tpl.code}
                      className="rounded-xl p-2 flex flex-col items-center gap-1 transition-all duration-200"
                      style={{
                        background: q > 0
                          ? "rgba(34,211,238,0.08)"
                          : "rgba(21,27,46,0.5)",
                        border: q > 0
                          ? "1px solid rgba(34,211,238,0.2)"
                          : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {flagSrc
                          ? <img src={flagSrc} alt="" className="h-3.5 w-auto rounded-[2px]" />
                          : <span className="text-xs">🏆</span>
                        }
                        <span className="font-mono text-xs font-bold"
                          style={{ color: q > 0 ? "#22D3EE" : "#71717A" }}>
                          {fmtCode(tpl.code)}
                        </span>
                      </div>

                      <span className="text-[10px] text-center leading-tight line-clamp-2 min-h-[2rem]"
                        style={{ color: "#71717A" }}>
                        {fmtName(tpl.name)}
                      </span>

                      <div className="flex items-center gap-1 w-full mt-1">
                        <button
                          className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                          onClick={() => adjust(tpl, -1)}
                          disabled={q === 0}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          value={q}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setLocalQty((p) => ({ ...p, [tpl.code]: val }));
                            clearTimeout(timers.current[tpl.code]);
                            timers.current[tpl.code] = setTimeout(() => persist(tpl, val), 600);
                          }}
                          className="flex-1 w-0 min-w-0 text-center text-lg font-black tabular-nums rounded-lg border-0 bg-transparent outline-none"
                          style={{ color: q > 0 ? "#22D3EE" : "#3F3F46" }}
                        />

                        <button
                          className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-all duration-200"
                          style={{ background: "rgba(34,211,238,0.1)", color: "#22D3EE" }}
                          onClick={() => adjust(tpl, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {isSaving && (
                        <span className="text-[9px] animate-pulse" style={{ color: "#71717A" }}>salvando...</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

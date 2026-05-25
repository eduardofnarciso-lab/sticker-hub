import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useRef } from "react";
import { Search, RotateCcw, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Figurinhas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{totalEmEstoque}</span> em estoque
            · 48 seleções · ordem do álbum
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              <RotateCcw className="h-4 w-4 mr-1" />
              Zerar tudo
            </Button>
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar seleção ou código (ex: BRA, JOR, FRA...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Seleções na ordem do álbum */}
      <div className="space-y-6 pb-8">
        {visibleSections.map((sec) => {
          const teamTotal = sec.stickers.reduce((acc, t) => acc + getQty(t.code), 0);
          const isIntro   = sec.group === "Intro";
          const flagSrc   = flagUrl(sec.teamCode, "w40");
          return (
            <div key={sec.team}>
              <div className="flex items-center gap-2 mb-3 pb-1 border-b">
                {flagSrc
                  ? <img src={flagSrc} alt={sec.team} className="h-5 w-auto rounded-sm shadow-sm" />
                  : <span className="text-base">🏆</span>
                }
                <span className="font-semibold text-sm">{sec.team}</span>
                {!isIntro && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Grupo {sec.group}
                  </span>
                )}
                <Badge
                  variant={teamTotal > 0 ? "default" : "outline"}
                  className="ml-auto text-xs"
                >
                  {teamTotal} un.
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {sec.stickers.map((tpl) => {
                  const q        = getQty(tpl.code);
                  const isSaving = saving.has(tpl.code);
                  return (
                    <div
                      key={tpl.code}
                      className={`rounded-xl border p-2 flex flex-col items-center gap-1 transition-all ${
                        q > 0
                          ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {flagSrc
                          ? <img src={flagSrc} alt="" className="h-3.5 w-auto rounded-[2px]" />
                          : <span className="text-xs">🏆</span>
                        }
                        <span className={`font-mono text-xs font-bold ${q > 0 ? "text-green-700" : "text-muted-foreground"}`}>
                          {tpl.code}
                        </span>
                      </div>

                      <span className="text-[10px] text-center text-muted-foreground leading-tight line-clamp-2 min-h-[2rem]">
                        {tpl.name}
                      </span>

                      <div className="flex items-center gap-1 w-full mt-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-7 w-7 shrink-0 rounded-lg text-red-500 hover:bg-red-50 ${q === 0 ? "opacity-30" : ""}`}
                          onClick={() => adjust(tpl, -1)}
                          disabled={q === 0}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>

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
                          className={`flex-1 w-0 min-w-0 text-center text-lg font-black tabular-nums rounded-lg border-0 bg-transparent outline-none focus:ring-1 focus:ring-green-400 ${
                            q > 0 ? "text-green-600" : "text-muted-foreground/40"
                          }`}
                        />

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 rounded-lg text-green-600 hover:bg-green-50"
                          onClick={() => adjust(tpl, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {isSaving && (
                        <span className="text-[9px] text-muted-foreground animate-pulse">salvando...</span>
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

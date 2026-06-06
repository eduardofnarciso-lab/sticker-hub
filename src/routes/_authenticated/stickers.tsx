import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StickerFormDialog, type StickerInput } from "@/components/StickerFormDialog";
import { brl, conditionLabel, statusLabel, fmtCode, fmtName } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/stickers")({
  component: StickersPage,
});

function StickersPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StickerInput | null>(null);

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

  const EXTRAS = [
    { code: "EX01-L", name: "Vinícius Júnior (Brasil) — Lilás" },
    { code: "EX01-B", name: "Vinícius Júnior (Brasil) — Bronze" },
    { code: "EX01-P", name: "Vinícius Júnior (Brasil) — Prata" },
    { code: "EX01-O", name: "Vinícius Júnior (Brasil) — Ouro" },
    { code: "EX02-L", name: "Moisés Caicedo (Equador) — Lilás" },
    { code: "EX02-B", name: "Moisés Caicedo (Equador) — Bronze" },
    { code: "EX02-P", name: "Moisés Caicedo (Equador) — Prata" },
    { code: "EX02-O", name: "Moisés Caicedo (Equador) — Ouro" },
    { code: "EX03-L", name: "Lamine Yamal (Espanha) — Lilás" },
    { code: "EX03-B", name: "Lamine Yamal (Espanha) — Bronze" },
    { code: "EX03-P", name: "Lamine Yamal (Espanha) — Prata" },
    { code: "EX03-O", name: "Lamine Yamal (Espanha) — Ouro" },
    { code: "EX04-L", name: "Cristiano Ronaldo (Portugal) — Lilás" },
    { code: "EX04-B", name: "Cristiano Ronaldo (Portugal) — Bronze" },
    { code: "EX04-P", name: "Cristiano Ronaldo (Portugal) — Prata" },
    { code: "EX04-O", name: "Cristiano Ronaldo (Portugal) — Ouro" },
    { code: "EX05-L", name: "Florian Wirtz (Alemanha) — Lilás" },
    { code: "EX05-B", name: "Florian Wirtz (Alemanha) — Bronze" },
    { code: "EX05-P", name: "Florian Wirtz (Alemanha) — Prata" },
    { code: "EX05-O", name: "Florian Wirtz (Alemanha) — Ouro" },
    { code: "EX06-L", name: "Luis Díaz (Colômbia) — Lilás" },
    { code: "EX06-B", name: "Luis Díaz (Colômbia) — Bronze" },
    { code: "EX06-P", name: "Luis Díaz (Colômbia) — Prata" },
    { code: "EX06-O", name: "Luis Díaz (Colômbia) — Ouro" },
    { code: "EX07-L", name: "Mohamed Salah (Egito) — Lilás" },
    { code: "EX07-B", name: "Mohamed Salah (Egito) — Bronze" },
    { code: "EX07-P", name: "Mohamed Salah (Egito) — Prata" },
    { code: "EX07-O", name: "Mohamed Salah (Egito) — Ouro" },
    { code: "EX08-L", name: "Alphonso Davies (Canadá) — Lilás" },
    { code: "EX08-B", name: "Alphonso Davies (Canadá) — Bronze" },
    { code: "EX08-P", name: "Alphonso Davies (Canadá) — Prata" },
    { code: "EX08-O", name: "Alphonso Davies (Canadá) — Ouro" },
    { code: "EX09-L", name: "Lionel Messi (Argentina) — Lilás" },
    { code: "EX09-B", name: "Lionel Messi (Argentina) — Bronze" },
    { code: "EX09-P", name: "Lionel Messi (Argentina) — Prata" },
    { code: "EX09-O", name: "Lionel Messi (Argentina) — Ouro" },
    { code: "EX10-L", name: "Achraf Hakimi (Marrocos) — Lilás" },
    { code: "EX10-B", name: "Achraf Hakimi (Marrocos) — Bronze" },
    { code: "EX10-P", name: "Achraf Hakimi (Marrocos) — Prata" },
    { code: "EX10-O", name: "Achraf Hakimi (Marrocos) — Ouro" },
    { code: "EX11-L", name: "Jude Bellingham (Inglaterra) — Lilás" },
    { code: "EX11-B", name: "Jude Bellingham (Inglaterra) — Bronze" },
    { code: "EX11-P", name: "Jude Bellingham (Inglaterra) — Prata" },
    { code: "EX11-O", name: "Jude Bellingham (Inglaterra) — Ouro" },
    { code: "EX12-L", name: "Raúl Jiménez (México) — Lilás" },
    { code: "EX12-B", name: "Raúl Jiménez (México) — Bronze" },
    { code: "EX12-P", name: "Raúl Jiménez (México) — Prata" },
    { code: "EX12-O", name: "Raúl Jiménez (México) — Ouro" },
    { code: "EX13-L", name: "Kylian Mbappé (França) — Lilás" },
    { code: "EX13-B", name: "Kylian Mbappé (França) — Bronze" },
    { code: "EX13-P", name: "Kylian Mbappé (França) — Prata" },
    { code: "EX13-O", name: "Kylian Mbappé (França) — Ouro" },
    { code: "EX14-L", name: "Son Heung-min (Coreia do Sul) — Lilás" },
    { code: "EX14-B", name: "Son Heung-min (Coreia do Sul) — Bronze" },
    { code: "EX14-P", name: "Son Heung-min (Coreia do Sul) — Prata" },
    { code: "EX14-O", name: "Son Heung-min (Coreia do Sul) — Ouro" },
    { code: "EX15-L", name: "Erling Haaland (Noruega) — Lilás" },
    { code: "EX15-B", name: "Erling Haaland (Noruega) — Bronze" },
    { code: "EX15-P", name: "Erling Haaland (Noruega) — Prata" },
    { code: "EX15-O", name: "Erling Haaland (Noruega) — Ouro" },
    { code: "EX16-L", name: "Christian Pulisic (Estados Unidos) — Lilás" },
    { code: "EX16-B", name: "Christian Pulisic (Estados Unidos) — Bronze" },
    { code: "EX16-P", name: "Christian Pulisic (Estados Unidos) — Prata" },
    { code: "EX16-O", name: "Christian Pulisic (Estados Unidos) — Ouro" },
    { code: "EX17-L", name: "Cody Gakpo (Holanda) — Lilás" },
    { code: "EX17-B", name: "Cody Gakpo (Holanda) — Bronze" },
    { code: "EX17-P", name: "Cody Gakpo (Holanda) — Prata" },
    { code: "EX17-O", name: "Cody Gakpo (Holanda) — Ouro" },
    { code: "EX18-L", name: "Luka Modrić (Croácia) — Lilás" },
    { code: "EX18-B", name: "Luka Modrić (Croácia) — Bronze" },
    { code: "EX18-P", name: "Luka Modrić (Croácia) — Prata" },
    { code: "EX18-O", name: "Luka Modrić (Croácia) — Ouro" },
    { code: "EX19-L", name: "Federico Valverde (Uruguai) — Lilás" },
    { code: "EX19-B", name: "Federico Valverde (Uruguai) — Bronze" },
    { code: "EX19-P", name: "Federico Valverde (Uruguai) — Prata" },
    { code: "EX19-O", name: "Federico Valverde (Uruguai) — Ouro" },
    { code: "EX20-L", name: "Jérémy Doku (Bélgica) — Lilás" },
    { code: "EX20-B", name: "Jérémy Doku (Bélgica) — Bronze" },
    { code: "EX20-P", name: "Jérémy Doku (Bélgica) — Prata" },
    { code: "EX20-O", name: "Jérémy Doku (Bélgica) — Ouro" },
    { code: "EX03-R", name: "Lamine Yamal (Espanha) — Rosa" },
    { code: "EX09-R", name: "Lionel Messi (Argentina) — Rosa" },
    { code: "EX19-R", name: "Federico Valverde (Uruguai) — Rosa" },
  ];

  const rarityColor: Record<string, string> = {
    L: "#A78BFA", B: "#CD7F32", P: "#C0C0C0", O: "#FFD700", R: "#F472B6",
  };
  const getRarityKey = (code: string) => code.split("-")[1] ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Figurinhas</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre e edite as figurinhas do seu acervo.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </div>

      {/* ── Seção Extras ── */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: "#A78BFA" }}>⭐ Figurinhas Extras</span>
          <span className="text-xs" style={{ color: "#71717A" }}>Cadastro rápido</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EXTRAS.map((e) => {
            const rarityKey = getRarityKey(e.code);
            const color = rarityColor[rarityKey] ?? "#A78BFA";
            const exists = data.some((s) => s.code === e.code);
            return (
              <button
                key={e.code}
                disabled={exists}
                onClick={() => {
                  setEditing({ id: undefined, name: e.name, code: e.code, album_id: null, team: "Extra", rarity: null, condition: "nova", quantity: 1, price: 5, image_url: null, notes: null, status: "disponivel" });
                  setOpen(true);
                }}
                className="rounded-xl px-2 py-2 text-left transition-all"
                style={{
                  background: exists ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${exists ? "rgba(255,255,255,0.06)" : color + "55"}`,
                  opacity: exists ? 0.5 : 1,
                  cursor: exists ? "not-allowed" : "pointer",
                }}
              >
                <div className="text-[10px] font-mono font-bold" style={{ color }}>{e.code}</div>
                <div className="text-[11px] leading-tight mt-0.5" style={{ color: exists ? "#52525B" : "#E4E4E7" }}>
                  {e.name.split(" — ")[0]}
                </div>
                <div className="text-[10px] font-bold mt-0.5" style={{ color }}>
                  {e.name.split(" — ")[1]}
                </div>
                {exists && <div className="text-[9px] mt-1" style={{ color: "#22C55E" }}>✓ cadastrada</div>}
              </button>
            );
          })}
        </div>
      </div>

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
                        {s.albums?.name ?? "Sem álbum"}{s.team ? ` · ${s.team}` : ""}
                      </div>
                    </div>
                    <Badge variant={s.status === "disponivel" ? "default" : "secondary"} className="text-[10px]">
                      {statusLabel[s.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-muted-foreground">
                      {conditionLabel[s.condition]} · {s.quantity}un
                    </span>
                    <span className="font-semibold">{brl(s.price)}</span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="w-full mt-2"
                onClick={() => {
                  setEditing({
                    id: s.id,
                    name: s.name,
                    code: s.code,
                    album_id: s.album_id,
                    team: s.team,
                    rarity: s.rarity,
                    condition: s.condition,
                    quantity: s.quantity,
                    price: Number(s.price),
                    image_url: s.image_url,
                    notes: s.notes,
                    status: s.status,
                  });
                  setOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            </Card>
          ))}
        </div>
      )}

      <StickerFormDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}

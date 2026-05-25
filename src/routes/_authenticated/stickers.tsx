import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StickerFormDialog, type StickerInput } from "@/components/StickerFormDialog";
import { brl, conditionLabel, statusLabel } from "@/lib/format";

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
                      {s.code && <div className="text-[11px] text-muted-foreground">#{s.code}</div>}
                      <div className="font-semibold truncate text-sm">{s.name}</div>
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

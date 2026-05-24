import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, Plus, Minus, ShoppingCart, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, statusLabel } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/stock")({
  component: StockPage,
});

function StockPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [albumFilter, setAlbumFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: albums = [] } = useQuery({
    queryKey: ["albums-select"],
    queryFn: async () => {
      const { data } = await supabase.from("albums").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: stickers = [], isLoading } = useQuery({
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stickers.filter((s) => {
      if (albumFilter !== "all" && s.album_id !== albumFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (term) {
        const hay = [s.code, s.name, s.team, s.albums?.name, s.rarity].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [stickers, search, albumFilter, statusFilter]);

  const updateQty = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const current = stickers.find((s) => s.id === id);
      if (!current) return;
      const next = Math.max(0, (current.quantity ?? 0) + delta);
      const patch: { quantity: number; status?: "disponivel" | "vendida" } = { quantity: next };
      if (next === 0 && current.status === "disponivel") patch.status = "vendida";
      if (next > 0 && current.status === "vendida") patch.status = "disponivel";
      const { error } = await supabase.from("stickers").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stickers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markSold = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stickers")
        .update({ status: "vendida", quantity: 0 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stickers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Marcada como vendida");
    },
  });

  const exportCSV = () => {
    const rows = [
      ["Album", "Codigo", "Nome", "Time", "Raridade", "Estado", "Quantidade", "Preco", "Status"],
      ...filtered.map((s) => [
        s.albums?.name ?? "",
        s.code ?? "",
        s.name,
        s.team ?? "",
        s.rarity ?? "",
        s.condition,
        s.quantity,
        Number(s.price).toFixed(2),
        s.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estoque-figurinhas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle quantidades, busque e exporte.</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card className="p-3 shadow-card space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por código, nome, time..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={albumFilter} onValueChange={setAlbumFilter}>
            <SelectTrigger><SelectValue placeholder="Álbum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os álbuns</SelectItem>
              {albums.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="vendida">Vendida</SelectItem>
              <SelectItem value="reservada">Reservada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-muted-foreground">Nada encontrado.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Card key={s.id} className="p-3 shadow-card">
              <div className="flex gap-3 items-center">
                <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {s.image_url && <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {s.code && <span className="text-[11px] text-muted-foreground">#{s.code}</span>}
                    <Badge variant={s.status === "disponivel" ? "default" : "secondary"} className="text-[10px]">
                      {statusLabel[s.status]}
                    </Badge>
                  </div>
                  <div className="font-medium text-sm truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.albums?.name ?? "Sem álbum"} · {brl(s.price)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty.mutate({ id: s.id, delta: -1 })}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <div className="w-8 text-center font-semibold text-sm">{s.quantity}</div>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty.mutate({ id: s.id, delta: 1 })}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {s.status === "disponivel" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full mt-2 text-xs"
                  onClick={() => {
                    if (confirm(`Marcar "${s.name}" como vendida?`)) markSold.mutate(s.id);
                  }}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Marcar como vendida
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

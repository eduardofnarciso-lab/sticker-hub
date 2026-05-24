import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { categoryLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/albums")({
  component: AlbumsPage,
});

type Album = {
  id: string;
  name: string;
  year: number | null;
  category: "copa" | "pokemon" | "tcg" | "futebol" | "outro";
  status: "ativo" | "inativo";
};

function AlbumsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Album | null>(null);

  const { data: albums = [], isLoading } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Album[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (a: Partial<Album> & { id?: string }) => {
      const userRes = await supabase.auth.getUser();
      const user_id = userRes.data.user?.id;
      if (!user_id) throw new Error("Não autenticado");
      const payload = {
        name: a.name!,
        year: a.year ?? null,
        category: a.category!,
        status: a.status!,
        user_id,
      };
      if (a.id) {
        const { error } = await supabase.from("albums").update(payload).eq("id", a.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("albums").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["albums"] });
      setOpen(false);
      setEditing(null);
      toast.success("Álbum salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("albums").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Álbum removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Álbuns</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize suas figurinhas por álbum.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo álbum
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : albums.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-muted-foreground">Você ainda não cadastrou nenhum álbum.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Criar primeiro álbum
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <Card key={a.id} className="p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{a.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.year ?? "—"} · {categoryLabel[a.category]}
                  </p>
                </div>
                <Badge variant={a.status === "ativo" ? "default" : "secondary"}>
                  {a.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(a); setOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Excluir "${a.name}"?`)) remove.mutate(a.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlbumDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        onSubmit={(data) => upsert.mutate({ ...data, id: editing?.id })}
        loading={upsert.isPending}
      />
    </div>
  );
}

function AlbumDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Album | null;
  onSubmit: (a: Partial<Album>) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [year, setYear] = useState<string>(editing?.year?.toString() ?? "");
  const [category, setCategory] = useState<Album["category"]>(editing?.category ?? "outro");
  const [status, setStatus] = useState<Album["status"]>(editing?.status ?? "ativo");

  // Reset on open
  if (open && editing && name === "" && editing.name) {
    setName(editing.name);
    setYear(editing.year?.toString() ?? "");
    setCategory(editing.category);
    setStatus(editing.status);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setName(""); setYear(""); setCategory("outro"); setStatus("ativo");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar álbum" : "Novo álbum"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return toast.error("Informe o nome");
            onSubmit({
              name: name.trim(),
              year: year ? Number(year) : null,
              category,
              status,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Album["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="copa">Copa</SelectItem>
                  <SelectItem value="pokemon">Pokémon</SelectItem>
                  <SelectItem value="tcg">TCG</SelectItem>
                  <SelectItem value="futebol">Futebol</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Album["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

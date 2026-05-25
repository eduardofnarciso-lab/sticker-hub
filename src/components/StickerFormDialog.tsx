import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

export type StickerInput = {
  id?: string;
  album_id?: string | null;
  code?: string | null;
  name: string;
  team?: string | null;
  rarity?: string | null;
  condition: "nova" | "usada" | "danificada";
  quantity: number;
  price: number;
  image_url?: string | null;
  notes?: string | null;
  status: "disponivel" | "vendida" | "reservada";
};

export function StickerFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<StickerInput> | null;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<StickerInput>({
    name: "",
    condition: "nova",
    quantity: 1,
    price: 0,
    status: "disponivel",
    album_id: null,
    code: "",
    team: "",
    rarity: "",
    notes: "",
    image_url: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        condition: initial?.condition ?? "nova",
        quantity: initial?.quantity ?? 1,
        price: initial?.price ?? 0,
        status: initial?.status ?? "disponivel",
        album_id: initial?.album_id ?? null,
        code: initial?.code ?? "",
        team: initial?.team ?? "",
        rarity: initial?.rarity ?? "",
        notes: initial?.notes ?? "",
        image_url: initial?.image_url ?? null,
        id: initial?.id,
      });
    }
  }, [open, initial]);

  const { data: albums = [] } = useQuery({
    queryKey: ["albums-select"],
    queryFn: async () => {
      const { data } = await supabase.from("albums").select("id, name").order("name");
      return data ?? [];
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? "shared";
      const ext = file.name.split(".").pop();
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("sticker-images").upload(path, file);
      if (error) throw error;
      const { data: pub } = supabase.storage.from("sticker-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: pub.publicUrl }));
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user_id = userRes.user?.id ?? null;
      const payload = {
        ...(user_id ? { user_id } : {}),
        name: form.name.trim(),
        album_id: form.album_id || null,
        code: form.code || null,
        team: form.team || null,
        rarity: form.rarity || null,
        condition: form.condition,
        quantity: Math.max(0, Number(form.quantity) || 0),
        price: Math.max(0, Number(form.price) || 0),
        image_url: form.image_url || null,
        notes: form.notes || null,
        status: form.status,
      };
      if (form.id) {
        const { error } = await supabase.from("stickers").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("stickers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stickers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Figurinha salva");
      onOpenChange(false);
      onSaved?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Informe o nome");
    save.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar figurinha" : "Nova figurinha"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-24 w-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              {form.image_url ? (
                <>
                  <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image_url: null }))}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Foto</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                }}
                disabled={uploading}
              />
              <p className="text-[11px] text-muted-foreground">
                Opcional. Use a aba “Escanear” para usar a câmera.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex: 145" />
            </div>
            <div className="space-y-1.5">
              <Label>Álbum</Label>
              <Select value={form.album_id ?? "none"} onValueChange={(v) => setForm({ ...form, album_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem álbum</SelectItem>
                  {albums.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nome do jogador/personagem *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Time/categoria</Label>
              <Input value={form.team ?? ""} onChange={(e) => setForm({ ...form, team: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Raridade</Label>
              <Input value={form.rarity ?? ""} onChange={(e) => setForm({ ...form, rarity: e.target.value })} placeholder="Comum, rara..." />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as StickerInput["condition"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nova">Nova</SelectItem>
                  <SelectItem value="usada">Usada</SelectItem>
                  <SelectItem value="danificada">Danificada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending || uploading}>
              {save.isPending ? "Salvando..." : "Salvar figurinha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

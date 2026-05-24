import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { brl, fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesPage,
});

function SalesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, stickers(name, code, image_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stickers = [] } = useQuery({
    queryKey: ["stickers-for-sale"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stickers")
        .select("id, name, code, quantity, price")
        .gt("quantity", 0)
        .order("name");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico e registro de vendas.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova venda
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : sales.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-muted-foreground">Nenhuma venda registrada.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <Card key={s.id} className="p-3 shadow-card">
              <div className="flex gap-3 items-center">
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {s.stickers?.image_url && (
                    <img src={s.stickers.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {s.stickers?.name ?? "Figurinha removida"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {fmtDate(s.created_at)} · {s.quantity}un · {s.buyer_name || "Sem comprador"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{brl(Number(s.sale_price) * s.quantity)}</div>
                  <div className="text-[10px] text-muted-foreground">{brl(s.sale_price)} cada</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewSaleDialog
        open={open}
        onOpenChange={setOpen}
        stickers={stickers}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["sales"] });
          qc.invalidateQueries({ queryKey: ["stickers"] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
          qc.invalidateQueries({ queryKey: ["stickers-for-sale"] });
        }}
      />
    </div>
  );
}

function NewSaleDialog({
  open,
  onOpenChange,
  stickers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stickers: Array<{ id: string; name: string; code: string | null; quantity: number; price: number }>;
  onSaved: () => void;
}) {
  const [stickerId, setStickerId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [buyerName, setBuyerName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const sel = stickers.find((s) => s.id === stickerId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sel) return toast.error("Selecione uma figurinha");
    if (quantity <= 0) return toast.error("Quantidade inválida");
    if (quantity > sel.quantity) return toast.error(`Estoque insuficiente (${sel.quantity} disponíveis)`);

    setLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user_id = userRes.user?.id!;
      const { error: saleErr } = await supabase.from("sales").insert({
        user_id,
        sticker_id: sel.id,
        quantity,
        sale_price: salePrice,
        buyer_name: buyerName || null,
        notes: notes || null,
      });
      if (saleErr) throw saleErr;

      const newQty = sel.quantity - quantity;
      const { error: upErr } = await supabase
        .from("stickers")
        .update({
          quantity: newQty,
          status: newQty === 0 ? "vendida" : "disponivel",
        })
        .eq("id", sel.id);
      if (upErr) throw upErr;

      toast.success("Venda registrada");
      onSaved();
      onOpenChange(false);
      setStickerId(""); setQuantity(1); setSalePrice(0); setBuyerName(""); setNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar venda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova venda</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Figurinha *</Label>
            <Select value={stickerId} onValueChange={(v) => {
              setStickerId(v);
              const s = stickers.find((x) => x.id === v);
              if (s) setSalePrice(Number(s.price));
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {stickers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code ? `#${s.code} ` : ""}{s.name} ({s.quantity} em estoque)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input type="number" min={1} max={sel?.quantity ?? 1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Valor unitário (R$)</Label>
              <Input type="number" min={0} step="0.01" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Comprador</Label>
            <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Registrar venda"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

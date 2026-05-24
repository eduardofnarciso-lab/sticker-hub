import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Sticker, Search, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/public-catalog/$userId")({
  component: PublicCatalog,
  head: () => ({
    meta: [
      { title: "Catálogo de Figurinhas" },
      { name: "description", content: "Confira figurinhas disponíveis para venda." },
      { property: "og:title", content: "Catálogo de Figurinhas" },
      { property: "og:description", content: "Confira figurinhas disponíveis para venda." },
    ],
  }),
});

function PublicCatalog() {
  const { userId } = Route.useParams();
  const [search, setSearch] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, whatsapp")
        .eq("id", userId)
        .maybeSingle();
      return data;
    },
  });

  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ["public-stickers", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("*, albums(name)")
        .eq("user_id", userId)
        .eq("status", "disponivel")
        .gt("quantity", 0)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stickers;
    return stickers.filter((s) => {
      const hay = [s.code, s.name, s.team, s.albums?.name].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [stickers, search]);

  const sellerName = profile?.display_name || "Vendedor";

  const buildWhatsappLink = (s: (typeof stickers)[number]) => {
    const phone = (profile?.whatsapp || "").replace(/\D/g, "");
    const msg = `Olá ${sellerName}! Tenho interesse na figurinha ${s.code ? `#${s.code} ` : ""}${s.name}${s.albums?.name ? ` (${s.albums.name})` : ""} por ${brl(s.price)}.`;
    const encoded = encodeURIComponent(msg);
    return phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-20 backdrop-blur bg-card/95">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sticker className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold tracking-tight truncate">Catálogo de {sellerName}</h1>
            <p className="text-xs text-muted-foreground">
              {stickers.length} figurinhas disponíveis
            </p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar figurinha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <p className="text-muted-foreground">
              {stickers.length === 0
                ? "Este vendedor ainda não tem figurinhas disponíveis."
                : "Nenhuma figurinha encontrada."}
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Card key={s.id} className="overflow-hidden shadow-card flex flex-col">
                <div className="aspect-square bg-muted overflow-hidden">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Sticker className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {s.code && <div className="text-[11px] text-muted-foreground">#{s.code}</div>}
                      <div className="font-semibold truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.albums?.name ?? "—"}{s.team ? ` · ${s.team}` : ""}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{s.quantity} un</Badge>
                  </div>
                  <div className="text-lg font-bold text-primary">{brl(s.price)}</div>
                  <Button asChild className="mt-auto" size="sm">
                    <a href={buildWhatsappLink(s)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      Tenho interesse
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-muted-foreground">
        Catálogo gerado por <span className="font-semibold">Catálogo de Figurinhas</span>
      </footer>
    </div>
  );
}

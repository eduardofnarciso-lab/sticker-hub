import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sticker,
  PackageCheck,
  Wallet,
  TrendingUp,
  ShoppingBag,
  Plus,
  Camera,
  Share2,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: stickers }, { data: sales }] = await Promise.all([
        supabase.from("stickers").select("quantity, price, status"),
        supabase.from("sales").select("quantity, sale_price"),
      ]);
      const list = stickers ?? [];
      const totalUnique = list.length;
      const totalAvailable = list
        .filter((s) => s.status === "disponivel")
        .reduce((acc, s) => acc + (s.quantity ?? 0), 0);
      const estimatedValue = list
        .filter((s) => s.status === "disponivel")
        .reduce((acc, s) => acc + (s.quantity ?? 0) * Number(s.price ?? 0), 0);
      const salesList = sales ?? [];
      const totalSold = salesList.reduce((acc, s) => acc + (s.quantity ?? 0), 0);
      const salesValue = salesList.reduce(
        (acc, s) => acc + (s.quantity ?? 0) * Number(s.sale_price ?? 0),
        0,
      );
      return { totalUnique, totalAvailable, estimatedValue, totalSold, salesValue };
    },
  });

  const sharePublic = async () => {
    if (!user) return;
    const url = `${window.location.origin}/public-catalog/${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.info(url);
    }
  };

  const stats = [
    { label: "Figurinhas únicas", value: data?.totalUnique ?? 0, icon: Sticker, color: "text-primary" },
    { label: "Disponíveis em estoque", value: data?.totalAvailable ?? 0, icon: PackageCheck, color: "text-success" },
    { label: "Valor estimado", value: brl(data?.estimatedValue), icon: Wallet, color: "text-primary" },
    { label: "Total vendidas", value: data?.totalSold ?? 0, icon: ShoppingBag, color: "text-warning" },
    { label: "Receita de vendas", value: brl(data?.salesValue), icon: TrendingUp, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Início</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral do seu acervo e vendas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={sharePublic}>
            <Share2 className="h-4 w-4" />
            Catálogo público
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 shadow-card">
              <div className={`${s.color} mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {isLoading ? "—" : s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction to="/scan" icon={Camera} label="Escanear figurinha" />
          <QuickAction to="/stickers" icon={Plus} label="Cadastrar manual" />
          <QuickAction to="/albums" icon={Sticker} label="Novo álbum" />
          <QuickAction to="/sales" icon={Receipt} label="Registrar venda" />
        </div>
      </div>

      {user && (
        <Card className="p-5 shadow-card border-dashed">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-primary mt-0.5" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Seu catálogo público</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Compartilhe com clientes para mostrar tudo que está disponível para venda.
              </p>
              <Link
                to="/public-catalog/$userId"
                params={{ userId: user.id }}
                target="_blank"
                rel="noopener"
                className="text-sm text-primary font-medium hover:underline mt-2 inline-flex items-center gap-1"
              >
                Abrir catálogo
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Plus;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="group p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-card transition-all flex flex-col gap-2"
    >
      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium">{label}</div>
    </Link>
  );
}

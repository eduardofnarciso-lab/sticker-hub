import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sticker,
  PackageSearch,
  Receipt,
  Share2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

const nav = [
  { to: "/dashboard", label: "Início",     icon: LayoutDashboard },
  { to: "/contagem",  label: "Figurinhas", icon: Sticker },
  { to: "/stock",     label: "Estoque",    icon: PackageSearch },
  { to: "/sales",     label: "Vendas",     icon: Receipt },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path     = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();

  // Busca perfil do usuário (nome + is_admin)
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, is_admin")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "Usuário";
  const isAdmin     = profile?.is_admin ?? false;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Até logo!");
    navigate({ to: "/login" });
  };

  const sharePublic = async () => {
    const url = `${window.location.origin}/public-catalog/${user?.id ?? ""}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link do catálogo copiado!");
    } catch {
      toast.info(url);
    }
  };

  // Navegação completa (inclui Admin se for admin)
  const navItems = [
    ...nav,
    ...(isAdmin ? [{ to: "/admin" as const, label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sticker className="h-5 w-5" />
            </div>
            <div className="font-semibold tracking-tight">Figurinhas</div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = path.startsWith(item.to);
            const Icon   = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da sidebar: usuário + ações */}
        <div className="p-3 border-t space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sm" onClick={sharePublic}>
            <Share2 className="h-4 w-4" />
            Catálogo público
          </Button>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold uppercase text-accent-foreground shrink-0">
              {displayName.charAt(0)}
            </div>
            <span className="text-xs font-medium truncate flex-1">{displayName}</span>
            <button
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-card/95 backdrop-blur border-b px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sticker className="h-4 w-4" />
          </div>
          <div className="font-semibold tracking-tight text-sm">Figurinhas</div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={sharePublic} aria-label="Compartilhar">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleSignOut} aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 md:ml-64 flex flex-col pb-16 md:pb-0">
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-4 md:py-8">{children}</div>

        {/* Rodapé global */}
        <footer className="border-t bg-card/50 py-3 px-4 md:px-8">
          <p className="text-center text-[11px] text-muted-foreground/50">
            Desenvolvido por{" "}
            <span className="font-semibold text-muted-foreground/70">SpiritRelay</span>
            {" "}· Empresa de Desenvolvimento
          </p>
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t pb-[env(safe-area-inset-bottom)]">
        <div className={`grid grid-cols-${navItems.length}`}>
          {navItems.map((item) => {
            const active = path.startsWith(item.to);
            const Icon   = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

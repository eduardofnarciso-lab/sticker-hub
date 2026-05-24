import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Library,
  Sticker,
  Camera,
  PackageSearch,
  Receipt,
  LogOut,
  Share2,
} from "lucide-react";
import { type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/albums", label: "Álbuns", icon: Library },
  { to: "/stickers", label: "Figurinhas", icon: Sticker },
  { to: "/scan", label: "Escanear", icon: Camera },
  { to: "/stock", label: "Estoque", icon: PackageSearch },
  { to: "/sales", label: "Vendas", icon: Receipt },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const sharePublic = async () => {
    if (!user) return;
    const url = `${window.location.origin}/public-catalog/${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link do catálogo copiado!");
    } catch {
      toast.info(url);
    }
  };

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
          {nav.map((item) => {
            const active = path.startsWith(item.to);
            const Icon = item.icon;
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
        <div className="p-3 border-t space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={sharePublic}>
            <Share2 className="h-4 w-4" />
            Compartilhar catálogo
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
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
          <Button size="icon" variant="ghost" onClick={() => signOut()} aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6">
          {nav.map((item) => {
            const active = path.startsWith(item.to);
            const Icon = item.icon;
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

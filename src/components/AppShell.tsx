import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sticker,
  PackageSearch,
  Receipt,
  Share2,
  LogOut,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

/** Ícone fiel ao logo Figu: dois cards empilhados com gradiente roxo→azul→ciano e sparkles */
function FiguLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fl-cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#7C3AED"/>
          <stop offset="55%"  stopColor="#60A5FA"/>
          <stop offset="100%" stopColor="#22D3EE"/>
        </linearGradient>
      </defs>
      {/* Back card */}
      <g transform="translate(35,35) rotate(8)">
        <rect x="-13" y="-17" width="26" height="34" rx="6"
          fill="rgba(96,165,250,0.08)" stroke="url(#fl-cg)" strokeWidth="1.4" strokeOpacity="0.5"/>
      </g>
      {/* Front card */}
      <g transform="translate(30,31)">
        <rect x="-13" y="-17" width="26" height="34" rx="6"
          fill="rgba(124,58,237,0.1)" stroke="url(#fl-cg)" strokeWidth="1.8"/>
        {/* Diagonal shine */}
        <line x1="-5" y1="9" x2="7" y2="-1"
          stroke="url(#fl-cg)" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.5"/>
        {/* Large sparkle */}
        <path d="M0,-8.5 L1.7,-1.7 L8.5,0 L1.7,1.7 L0,8.5 L-1.7,1.7 L-8.5,0 L-1.7,-1.7 Z"
          fill="url(#fl-cg)" fillOpacity="0.85"/>
        {/* Small sparkle top-left */}
        <g transform="translate(-5.5,-8)">
          <path d="M0,-3 L0.6,-0.6 L3,0 L0.6,0.6 L0,3 L-0.6,0.6 L-3,0 L-0.6,-0.6 Z"
            fill="url(#fl-cg)" fillOpacity="0.8"/>
        </g>
      </g>
      {/* Outer sparkle top-left */}
      <g transform="translate(14,16)">
        <path d="M0,-4.5 L0.9,-0.9 L4.5,0 L0.9,0.9 L0,4.5 L-0.9,0.9 L-4.5,0 L-0.9,-0.9 Z"
          fill="url(#fl-cg)" fillOpacity="0.9"/>
      </g>
      {/* Outer sparkle bottom-right */}
      <g transform="translate(50,48)">
        <path d="M0,-3 L0.6,-0.6 L3,0 L0.6,0.6 L0,3 L-0.6,0.6 L-3,0 L-0.6,-0.6 Z"
          fill="url(#fl-cg)" fillOpacity="0.7"/>
      </g>
    </svg>
  );
}

const nav = [
  { to: "/dashboard",     label: "Início",     icon: LayoutDashboard },
  { to: "/contagem",      label: "Figurinhas", icon: Sticker },
  { to: "/stock",         label: "Estoque",    icon: PackageSearch },
  { to: "/sales",         label: "Vendas",     icon: Receipt },
  { to: "/stock-history", label: "Histórico",  icon: ClipboardList },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path     = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const navItems = [
    ...nav,
    ...(isAdmin ? [{ to: "/admin" as const, label: "Admin", icon: ShieldCheck }] : []),
  ];

  const navItemStyle = (active: boolean) => ({
    background: active ? "rgba(139,92,246,0.15)" : "transparent",
    color: active ? "#8B5CF6" : "#A1A1AA",
    border: active ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#0B1020" }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r"
        style={{
          background: "rgba(11,16,32,0.97)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#0d0a1a" }}
            >
              <FiguLogo size={28} />
            </div>
            <div>
              <div className="font-bold tracking-tight" style={{ color: "#FFFFFF" }}>Figu</div>
              <div className="text-[10px]" style={{ color: "#A1A1AA" }}>Copa 2026</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon   = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={navItemStyle(active)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: "#8B5CF6", boxShadow: "0 0 6px #8B5CF6" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé sidebar */}
        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button
            onClick={sharePublic}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-1"
            style={{ color: "#A1A1AA", background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Share2 className="h-4 w-4" />
            Catálogo público
          </button>

          {/* Usuário */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #60A5FA)", color: "#fff" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium truncate flex-1" style={{ color: "#FFFFFF" }}>
              {displayName}
            </span>
            <button onClick={handleSignOut} title="Sair" className="transition-colors"
              style={{ color: "#71717A" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#71717A")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden sticky top-0 z-30 px-4 h-14 flex items-center justify-between"
        style={{
          background: "rgba(11,16,32,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#0d0a1a" }}
          >
            <FiguLogo size={24} />
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: "#FFFFFF" }}>Figu</span>
            <span className="text-[10px] ml-1.5" style={{ color: "#A1A1AA" }}>Copa 2026</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={sharePublic}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleSignOut}
            className="text-zinc-400 hover:text-red-400 hover:bg-red-500/5"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 md:ml-64 flex flex-col pb-20 md:pb-0">
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-4 md:py-8">
          {children}
        </div>

        {/* Footer */}
        <footer className="py-3 px-4 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-[11px]" style={{ color: "#71717A" }}>
            Desenvolvido por{" "}
            <a
              href="https://spiritrelay.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#A78BFA", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              SpiritRelay
            </a>
            {" "}·{" "}
            <a
              href="mailto:contato@spiritrelay.com"
              style={{ color: "#71717A", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A78BFA")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#71717A")}
            >
              contato@spiritrelay.com
            </a>
          </p>
        </footer>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30"
        style={{
          background: "rgba(11,16,32,0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex">
          {navItems.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon   = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-medium flex-1 transition-all"
                style={{ color: active ? "#8B5CF6" : "#71717A" }}
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

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bem-vindo!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "E-mail ou senha incorretos.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      background: "#0B1020",
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.18) 0%, transparent 60%)",
      position: "relative",
    }}>
      <div style={{ width: "100%", maxWidth: "384px", position: "relative", zIndex: 10 }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <div style={{
            height: "64px", width: "64px",
            borderRadius: "1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1rem",
            background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
            boxShadow: "0 0 32px rgba(139,92,246,0.4), 0 8px 24px rgba(0,0,0,0.4)",
          }}>
            <Sparkles style={{ width: "32px", height: "32px", color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#FFFFFF", margin: 0 }}>
            Figu
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#A1A1AA", marginTop: "0.25rem" }}>
            Copa 2026 · Entre para continuar
          </p>
        </div>

        {/* Card de login */}
        <div style={{
          borderRadius: "1rem",
          padding: "1.5rem",
          background: "rgba(21,27,46,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <Label htmlFor="email" style={{ color: "#A1A1AA" }}>E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <Label htmlFor="password" style={{ color: "#A1A1AA" }}>Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: 600,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginTop: "0.5rem",
                background: "linear-gradient(135deg, #8B5CF6, #60A5FA)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(139,92,246,0.35)",
                transition: "transform 0.15s, opacity 0.15s",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#52525B",
          marginTop: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.375rem",
        }}>
          <Lock style={{ width: "12px", height: "12px" }} />
          Acesso restrito. Fale com o administrador.
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, UserPlus, Mail, Trash2, Crown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [sending, setSending]   = useState(false);

  // Verifica se o usuário logado é admin
  const { data: profile, isLoading: loadingProfile } = useQuery({
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

  // Redireciona se não for admin
  if (!loadingProfile && !profile?.is_admin) {
    navigate({ to: "/dashboard" });
    return null;
  }

  // Lista todos os usuários cadastrados
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    enabled: !!profile?.is_admin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, is_admin, created_at")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Convida usuário via Magic Link (não exige service_role)
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Cria o usuário via signUp com senha temporária aleatória
      // O admin pode depois redefinir a senha pelo painel Supabase
      // ou usar "Recuperar senha" pelo e-mail
      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: { display_name: name || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;

      // Insere perfil manualmente caso o trigger não rode (edge case)
      if (data.user) {
        await supabase.from("profiles").upsert({
          id:           data.user.id,
          display_name: name || email.split("@")[0],
          is_admin:     false,
        }, { onConflict: "id" });
      }

      toast.success(`Convite enviado para ${email}! O usuário deve verificar o e-mail e depois usar "Esqueci minha senha" para definir a senha.`);
      setEmail("");
      setName("");
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao convidar usuário.");
    } finally {
      setSending(false);
    }
  };

  // Alterna admin
  const toggleAdmin = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !isAdmin })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
      toast.success("Permissão atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loadingProfile) {
    return <div className="py-20 text-center text-muted-foreground">Verificando permissões...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários da plataforma.</p>
        </div>
      </div>

      {/* Convidar novo usuário */}
      <Card className="p-5">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar novo usuário
        </h2>
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do vendedor"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <Mail className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Um e-mail de confirmação será enviado. Após confirmar, o usuário deve usar{" "}
              <strong>"Esqueci minha senha"</strong> no login para definir sua senha e acessar o sistema.
            </span>
          </div>
          <Button type="submit" disabled={sending} className="w-full">
            {sending ? "Enviando..." : "Convidar usuário"}
          </Button>
        </form>
      </Card>

      {/* Lista de usuários */}
      <Card className="p-5">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <User className="h-4 w-4" />
          Usuários cadastrados ({profiles.length})
        </h2>
        <div className="space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {(p.display_name ?? "U").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.display_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
              {p.is_admin && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {/* Não deixa remover admin do próprio usuário */}
              {p.id !== user?.id && (
                <button
                  onClick={() => toggleAdmin.mutate({ id: p.id, isAdmin: p.is_admin })}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border hover:bg-muted"
                  title={p.is_admin ? "Remover admin" : "Tornar admin"}
                >
                  {p.is_admin ? "Remover admin" : "Tornar admin"}
                </button>
              )}
            </div>
          ))}
          {profiles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

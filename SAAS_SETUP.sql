-- ═══════════════════════════════════════════════════════════════════════
--  SAAS SETUP — Figurinhas Copa 2026
--  ⚠️  NENHUM DELETE NOS SEUS DADOS EXISTENTES
--  Execute PASSO 1, depois crie sua conta, depois PASSO 2 e PASSO 3
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
--  PASSO 1 — Estrutura base (seguro, pode rodar agora)
-- ───────────────────────────────────────────────────────────────────────

-- 1.1 Tabela de perfis de usuários (com flag de admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  is_admin      boolean NOT NULL DEFAULT false,
  whatsapp      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Trigger: cria perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1.3 Garantir que a coluna user_id existe em stickers (e aceita NULL por enquanto)
ALTER TABLE public.stickers
  ALTER COLUMN user_id DROP NOT NULL;

-- 1.5 Constraint UNIQUE por (code, user_id) — cada usuário tem seu próprio estoque
--     O código abaixo remove o UNIQUE antigo (só em code) se existir, e cria o novo
ALTER TABLE public.stickers DROP CONSTRAINT IF EXISTS stickers_code_key;
ALTER TABLE public.stickers DROP CONSTRAINT IF EXISTS stickers_code_user_id_key;
ALTER TABLE public.stickers
  ADD CONSTRAINT stickers_code_user_id_key UNIQUE (code, user_id);

-- 1.4 Função helper: verifica se o usuário logado é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ───────────────────────────────────────────────────────────────────────
--  PASSO 2 — Migrar dados existentes para o seu usuário admin
--  (rode DEPOIS de criar sua conta pelo app e pegar seu UUID)
--
--  Como pegar seu UUID:
--  Supabase → Authentication → Users → copie o UUID do seu e-mail
--
--  Substitua 'SEU-UUID-AQUI' pelo seu UUID real e rode este bloco:
-- ───────────────────────────────────────────────────────────────────────

/*
DO $$
DECLARE
  admin_id uuid := 'SEU-UUID-AQUI';  -- ← cole seu UUID aqui
BEGIN
  -- Migra stickers sem dono para o admin
  UPDATE public.stickers
    SET user_id = admin_id
  WHERE user_id IS NULL;

  -- Migra vendas sem dono para o admin
  UPDATE public.sales
    SET user_id = admin_id
  WHERE user_id IS NULL;

  -- Marca o usuário como admin
  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (admin_id, 'Admin', true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;

  RAISE NOTICE 'Migração concluída! Stickers migrados: %, vendas migradas: %',
    (SELECT count(*) FROM public.stickers WHERE user_id = admin_id),
    (SELECT count(*) FROM public.sales WHERE user_id = admin_id);
END;
$$;
*/

-- ───────────────────────────────────────────────────────────────────────
--  PASSO 3 — Habilitar RLS (rode DEPOIS do Passo 2)
--  ⚠️  Só rode depois de confirmar que seus dados têm user_id preenchido:
--     SELECT count(*) FROM stickers WHERE user_id IS NULL;
--     (deve retornar 0)
-- ───────────────────────────────────────────────────────────────────────

/*
-- Habilitar RLS
ALTER TABLE public.stickers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;

-- Policies: stickers
DROP POLICY IF EXISTS "stickers_own"   ON public.stickers;
DROP POLICY IF EXISTS "stickers_admin" ON public.stickers;

CREATE POLICY "stickers_own" ON public.stickers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "stickers_admin" ON public.stickers
  FOR ALL USING (public.is_admin());

-- Policies: sales
DROP POLICY IF EXISTS "sales_own"   ON public.sales;
DROP POLICY IF EXISTS "sales_admin" ON public.sales;

CREATE POLICY "sales_own" ON public.sales
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "sales_admin" ON public.sales
  FOR ALL USING (public.is_admin());

-- Policies: profiles (cada um vê/edita só o seu)
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;

CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Catálogo público: anon pode VER stickers (para a tela pública)
DROP POLICY IF EXISTS "stickers_public_read" ON public.stickers;
CREATE POLICY "stickers_public_read" ON public.stickers
  FOR SELECT USING (true);

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.stickers TO anon;
GRANT ALL ON public.stickers  TO authenticated;
GRANT ALL ON public.sales     TO authenticated;
GRANT ALL ON public.profiles  TO authenticated;
GRANT ALL ON public.albums    TO authenticated;
*/

-- ───────────────────────────────────────────────────────────────────────
--  VERIFICAÇÃO FINAL
-- ───────────────────────────────────────────────────────────────────────
/*
SELECT
  (SELECT count(*) FROM public.stickers WHERE user_id IS NULL)  AS stickers_sem_dono,
  (SELECT count(*) FROM public.stickers WHERE user_id IS NOT NULL) AS stickers_com_dono,
  (SELECT count(*) FROM public.profiles WHERE is_admin = true)   AS total_admins;
*/

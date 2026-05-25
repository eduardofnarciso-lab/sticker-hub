-- ═══════════════════════════════════════════════════════════════
--  LIBERAR ACESSO — Cole no SQL Editor do Supabase e clique Run
--  Resolve: 401 Unauthorized, RLS bloqueando escrita
-- ═══════════════════════════════════════════════════════════════

-- 1. Tornar user_id opcional
ALTER TABLE public.albums   ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.stickers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.sales    ALTER COLUMN user_id DROP NOT NULL;

-- 2. Desabilitar RLS completamente
ALTER TABLE public.albums   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales    DISABLE ROW LEVEL SECURITY;

-- 3. Dar permissão total ao anon (chave pública do browser)
GRANT ALL ON public.albums   TO anon;
GRANT ALL ON public.stickers TO anon;
GRANT ALL ON public.sales    TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- 4. Confirmar
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('albums','stickers','sales')
ORDER BY tablename;

-- Esperado: rowsecurity = false nas 3 tabelas

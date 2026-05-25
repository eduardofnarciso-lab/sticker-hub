-- ═══════════════════════════════════════════════════════════════
--  CORRIGIR BANCO — Rode este script no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1. Tornar user_id opcional em todas as tabelas
ALTER TABLE public.albums   ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.stickers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.sales    ALTER COLUMN user_id DROP NOT NULL;

-- 2. Desabilitar RLS
ALTER TABLE public.albums   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales    DISABLE ROW LEVEL SECURITY;

-- 3. Confirmar
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('albums','stickers','sales')
ORDER BY tablename;

-- Esperado: rowsecurity = false em todas

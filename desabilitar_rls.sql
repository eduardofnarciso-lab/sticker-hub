-- ============================================================
-- RODE PRIMEIRO: Desabilitar autenticação obrigatória
-- SQL Editor do Supabase → cole e clique em Run
-- ============================================================

-- 1. Tornar user_id opcional (sem auth, não há user)
ALTER TABLE public.albums ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.stickers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.sales ALTER COLUMN user_id DROP NOT NULL;

-- 2. Desabilitar RLS (uso interno/single-user, sem necessidade de isolamento)
ALTER TABLE public.albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Storage: permitir upload sem autenticação
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own images" ON storage.objects;

CREATE POLICY "Allow upload sticker images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sticker-images');

CREATE POLICY "Allow update sticker images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'sticker-images');

CREATE POLICY "Allow delete sticker images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'sticker-images');

-- Confirmar
SELECT 'RLS desabilitado e storage liberado com sucesso!' AS status;

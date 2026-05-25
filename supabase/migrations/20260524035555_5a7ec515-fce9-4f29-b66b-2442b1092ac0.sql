
-- Fix search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke execute on internal trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten storage SELECT: only allow viewing files in sticker-images via authenticated or via the public catalog (public bucket already serves URLs)
DROP POLICY IF EXISTS "Anyone can view sticker images" ON storage.objects;
CREATE POLICY "Public read sticker images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sticker-images');

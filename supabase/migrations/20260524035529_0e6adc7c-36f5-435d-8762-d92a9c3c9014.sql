
-- Enums
CREATE TYPE public.album_category AS ENUM ('copa', 'pokemon', 'tcg', 'futebol', 'outro');
CREATE TYPE public.album_status AS ENUM ('ativo', 'inativo');
CREATE TYPE public.sticker_condition AS ENUM ('nova', 'usada', 'danificada');
CREATE TYPE public.sticker_status AS ENUM ('disponivel', 'vendida', 'reservada');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Albums
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER,
  category public.album_category NOT NULL DEFAULT 'outro',
  status public.album_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_albums_user_id ON public.albums(user_id);
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own albums"
  ON public.albums FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active albums"
  ON public.albums FOR SELECT
  TO anon
  USING (status = 'ativo');

CREATE TRIGGER albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stickers
CREATE TABLE public.stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  code TEXT,
  name TEXT NOT NULL,
  team TEXT,
  rarity TEXT,
  condition public.sticker_condition NOT NULL DEFAULT 'nova',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url TEXT,
  notes TEXT,
  status public.sticker_status NOT NULL DEFAULT 'disponivel',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stickers_user_id ON public.stickers(user_id);
CREATE INDEX idx_stickers_album_id ON public.stickers(album_id);
CREATE INDEX idx_stickers_status ON public.stickers(status);

ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stickers"
  ON public.stickers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view available stickers"
  ON public.stickers FOR SELECT
  TO anon
  USING (status = 'disponivel' AND quantity > 0);

CREATE TRIGGER stickers_updated_at
  BEFORE UPDATE ON public.stickers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sales
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_id UUID REFERENCES public.stickers(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  sale_price NUMERIC(10,2) NOT NULL CHECK (sale_price >= 0),
  buyer_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_sticker_id ON public.sales(sticker_id);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sales"
  ON public.sales FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for sticker images
INSERT INTO storage.buckets (id, name, public)
VALUES ('sticker-images', 'sticker-images', true);

CREATE POLICY "Anyone can view sticker images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sticker-images');

CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sticker-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'sticker-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sticker-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

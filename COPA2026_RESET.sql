-- ═══════════════════════════════════════════════════════════════
--  RESET: Apaga tudo do álbum Copa 2026 para começar do zero
--  PASSO 1: rode este script
--  PASSO 2: rode o COPA2026_SEED.sql
-- ═══════════════════════════════════════════════════════════════

-- Remove as figurinhas do álbum Copa 2026
DELETE FROM public.stickers
WHERE album_id IN (
  SELECT id FROM public.albums WHERE name = 'Copa do Mundo 2026'
);

-- Remove o álbum
DELETE FROM public.albums
WHERE name = 'Copa do Mundo 2026';

-- Confirma que limpou
SELECT
  'Figurinhas restantes no banco: ' || COUNT(*) AS resultado
FROM public.stickers;

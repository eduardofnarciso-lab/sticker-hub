-- ═══════════════════════════════════════════════════════════════
--  PASSO 1: Apagar stickers com código no formato antigo (com espaço)
--  ex: "BRA 1", "MEX 2", "FWC 1", "COP 1"
-- ═══════════════════════════════════════════════════════════════
DELETE FROM public.stickers
WHERE code ~ '^[A-Z]{2,3} [0-9]+$'
   OR code ~ '^FWC [0-9]+$'
   OR code ~ '^COP [0-9]+$';

-- ═══════════════════════════════════════════════════════════════
--  PASSO 2: Zerar todas as quantidades
-- ═══════════════════════════════════════════════════════════════
UPDATE public.stickers SET quantity = 0;

-- ═══════════════════════════════════════════════════════════════
--  PASSO 3: Acertar preços
-- ═══════════════════════════════════════════════════════════════
UPDATE public.stickers SET price = 2
WHERE code = '00'
   OR code ~ '^FWC[0-9]+$'
   OR code ~ '^[A-Z]{2,3}1$';

UPDATE public.stickers SET price = 1
WHERE price = 0 OR price IS NULL;

-- ═══════════════════════════════════════════════════════════════
--  PASSO 4: Confirmar
-- ═══════════════════════════════════════════════════════════════
SELECT
  CASE WHEN price = 2 THEN 'R$ 2,00 (Logo/Copa)' ELSE 'R$ 1,00 (Jogador)' END AS tipo,
  COUNT(*) AS qtd,
  SUM(quantity) AS total_estoque
FROM public.stickers
GROUP BY 1 ORDER BY 1;

-- Esperado:
--  R$ 1,00 → 912 figurinhas, estoque 0
--  R$ 2,00 →  68 figurinhas, estoque 0
--  TOTAL   → 980

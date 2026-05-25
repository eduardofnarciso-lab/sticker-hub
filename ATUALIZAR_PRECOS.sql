-- ═══════════════════════════════════════════════════════════════
--  ATUALIZAR PREÇOS — Cole no SQL Editor do Supabase
--  Logo (X1) e Copa (FWC/00) = R$ 2,00
--  Demais (2 a 20) = R$ 1,00
-- ═══════════════════════════════════════════════════════════════

-- R$ 2,00: figurinha 00, FWC 1-19, e logos das seleções (ex: BRA1, MEX1)
UPDATE public.stickers
SET price = 2
WHERE
  code = '00'
  OR code LIKE 'FWC%'
  OR code ~ '^[A-Z]{2,3}1$';   -- BRA1, MEX1, GER1, etc.

-- R$ 1,00: todas as demais (posições 2 a 20)
UPDATE public.stickers
SET price = 1
WHERE price = 0;

-- Confirmar
SELECT
  CASE
    WHEN code = '00' OR code LIKE 'FWC%' OR code ~ '^[A-Z]{2,3}1$' THEN 'R$ 2,00 (Logo/Copa)'
    ELSE 'R$ 1,00 (Jogador)'
  END AS tipo,
  COUNT(*) AS qtd,
  SUM(price) AS total_preco
FROM public.stickers
GROUP BY 1
ORDER BY 1;

-- ═══════════════════════════════════════════════════════════════
--  SEED v3: Figurinhas Copa do Mundo 2026
--  ⚠️  RODE PRIMEIRO o COPA2026_RESET.sql para limpar versões antigas
--
--  Estrutura correta:
--    FWC  1–19 → figurinhas gerais Copa
--    COP  1–14 → seção Copa (ajuste o código se for diferente no álbum)
--    Seleções  → 20 figurinhas cada
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_album_id uuid;
  v_code     text;
  v_team     text;
  i          int;
  idx        int;

  -- ── 20 figurinhas por seleção ────────────────────────────────
  v_labels text[] := ARRAY[
    'Escudo',
    'Foto da Seleção',
    'Goleiro',
    'Lateral Direito',
    'Zagueiro',
    'Zagueiro',
    'Lateral Esquerdo',
    'Volante',
    'Meia',
    'Meia-Atacante',
    'Atacante',
    'Atacante',
    'Atacante',
    'Goleiro (Res.)',
    'Defensor (Res.)',
    'Defensor (Res.)',
    'Meia (Res.)',
    'Atacante (Res.)',
    'Craque da Seleção',
    'Figurinha Especial'
  ];

  -- ── FWC 1–19 (figurinhas gerais FIFA / Copa) ─────────────────
  v_fwc text[] := ARRAY[
    'Capa do Álbum',
    'Logo Copa 2026',
    'Mascote Oficial',
    'Taça FIFA',
    'Estádio MetLife – Nova Jersey / Nova York',
    'Estádio AT&T – Dallas',
    'Rose Bowl – Los Angeles',
    'Levi''s Stadium – San Francisco',
    'Arrowhead Stadium – Kansas City',
    'SoFi Stadium – Los Angeles',
    'Gillette Stadium – Boston',
    'NRG Stadium – Houston',
    'Camping World Stadium – Orlando',
    'Estádio Azteca – Cidade do México',
    'Estádio Akron – Guadalajara',
    'Estádio BBVA – Monterrey',
    'BC Place – Vancouver',
    'BMO Field – Toronto',
    'Estádio Olímpico – Montreal'
  ];

  -- ── COP 1–14 (seção Copa — ajuste o prefixo se necessário) ───
  v_cop text[] := ARRAY[
    'Abertura da Copa',
    'Mapa dos Grupos',
    'Fase de Grupos',
    'Fase de Grupos',
    'Oitavas de Final',
    'Oitavas de Final',
    'Quartas de Final',
    'Quartas de Final',
    'Semifinais',
    'Semifinais',
    'Final',
    'Artilheiro / Melhor Goleiro',
    'Seleção do Torneio',
    'Campeão 2026'
  ];

  -- ── Seleções: [CÓDIGO PANINI BR, NOME] ───────────────────────
  v_teams text[][] := ARRAY[

    -- CONMEBOL (América do Sul)
    ARRAY['BRA', 'Brasil'],
    ARRAY['ARG', 'Argentina'],
    ARRAY['COL', 'Colômbia'],
    ARRAY['URU', 'Uruguai'],
    ARRAY['EQU', 'Equador'],
    ARRAY['VEN', 'Venezuela'],
    ARRAY['PAR', 'Paraguai'],
    ARRAY['CHI', 'Chile'],

    -- CONCACAF
    ARRAY['EUA', 'Estados Unidos'],
    ARRAY['MEX', 'México'],
    ARRAY['CAN', 'Canadá'],
    ARRAY['PAN', 'Panamá'],
    ARRAY['HON', 'Honduras'],
    ARRAY['CRC', 'Costa Rica'],
    ARRAY['JAM', 'Jamaica'],
    ARRAY['GUA', 'Guatemala'],

    -- UEFA (Europa)
    ARRAY['FRA', 'França'],
    ARRAY['ESP', 'Espanha'],
    ARRAY['ALE', 'Alemanha'],
    ARRAY['ING', 'Inglaterra'],
    ARRAY['POR', 'Portugal'],
    ARRAY['HOL', 'Holanda'],
    ARRAY['BEL', 'Bélgica'],
    ARRAY['ITA', 'Itália'],
    ARRAY['SUI', 'Suíça'],
    ARRAY['CRO', 'Croácia'],
    ARRAY['SER', 'Sérvia'],
    ARRAY['AUT', 'Áustria'],
    ARRAY['TUR', 'Turquia'],
    ARRAY['DIN', 'Dinamarca'],
    ARRAY['ROM', 'Romênia'],
    ARRAY['ESC', 'Escócia'],
    ARRAY['POL', 'Polônia'],
    ARRAY['SVK', 'Eslováquia'],
    ARRAY['TCH', 'Rep. Tcheca'],
    ARRAY['UCR', 'Ucrânia'],
    ARRAY['GRE', 'Grécia'],
    ARRAY['HUN', 'Hungria'],

    -- CAF (África)
    ARRAY['MAR', 'Marrocos'],
    ARRAY['SEN', 'Senegal'],
    ARRAY['EGI', 'Egito'],
    ARRAY['NIG', 'Nigéria'],
    ARRAY['CAM', 'Camarões'],
    ARRAY['TUN', 'Tunísia'],
    ARRAY['CIV', 'Costa do Marfim'],
    ARRAY['AFS', 'África do Sul'],
    ARRAY['COD', 'RD Congo'],
    ARRAY['ALG', 'Argélia'],
    ARRAY['GHA', 'Gana'],
    ARRAY['MLI', 'Mali'],

    -- AFC (Ásia)
    ARRAY['JPN', 'Japão'],
    ARRAY['COR', 'Coreia do Sul'],
    ARRAY['JOR', 'Jordânia'],
    ARRAY['AUS', 'Austrália'],
    ARRAY['IRA', 'Irã'],
    ARRAY['SAU', 'Arábia Saudita'],
    ARRAY['IND', 'Indonésia'],
    ARRAY['UZB', 'Uzbequistão'],
    ARRAY['CHN', 'China'],
    ARRAY['IRQ', 'Iraque'],
    ARRAY['OMA', 'Omã'],
    ARRAY['QAT', 'Qatar'],

    -- OFC (Oceania)
    ARRAY['NZL', 'Nova Zelândia']

  ];

BEGIN
  -- ── Cria álbum ───────────────────────────────────────────────
  SELECT id INTO v_album_id
    FROM public.albums
   WHERE name = 'Copa do Mundo 2026'
   LIMIT 1;

  IF v_album_id IS NULL THEN
    INSERT INTO public.albums (name)
    VALUES ('Copa do Mundo 2026')
    RETURNING id INTO v_album_id;
  END IF;

  -- ── FWC 1–19 ────────────────────────────────────────────────
  FOR i IN 1..19 LOOP
    INSERT INTO public.stickers (code, name, team, quantity, status, album_id, price)
    SELECT
      'FWC ' || i,
      'Copa 2026 — ' || v_fwc[i],
      'Copa do Mundo 2026',
      0, 'disponivel', v_album_id, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stickers WHERE code = 'FWC ' || i
    );
  END LOOP;

  -- ── COP 1–14 ────────────────────────────────────────────────
  FOR i IN 1..14 LOOP
    INSERT INTO public.stickers (code, name, team, quantity, status, album_id, price)
    SELECT
      'COP ' || i,
      'Copa 2026 — ' || v_cop[i],
      'Copa do Mundo 2026',
      0, 'disponivel', v_album_id, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stickers WHERE code = 'COP ' || i
    );
  END LOOP;

  -- ── Seleções (20 figurinhas cada) ────────────────────────────
  FOR idx IN 1..array_length(v_teams, 1) LOOP
    v_code := v_teams[idx][1];
    v_team := v_teams[idx][2];

    FOR i IN 1..20 LOOP
      INSERT INTO public.stickers (code, name, team, quantity, status, album_id, price)
      SELECT
        v_code || ' ' || i,
        v_team || ' — ' || v_labels[i],
        v_team,
        0, 'disponivel', v_album_id, 0
      WHERE NOT EXISTS (
        SELECT 1 FROM public.stickers WHERE code = v_code || ' ' || i
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed v3 concluído!';
END $$;

-- Resumo
SELECT
  team                  AS "Seleção",
  COUNT(*)              AS "Figurinhas"
FROM public.stickers
WHERE album_id = (SELECT id FROM public.albums WHERE name = 'Copa do Mundo 2026' LIMIT 1)
GROUP BY team
ORDER BY team;

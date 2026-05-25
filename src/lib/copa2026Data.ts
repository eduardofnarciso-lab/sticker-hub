// ═══════════════════════════════════════════════════════════════
//  Álbum Panini FIFA World Cup 2026 — Dados oficiais
//  980 figurinhas: 20 intro (00 + FWC1-19) + 48 seleções × 20
//  Ordem: igual ao álbum físico (por grupos A → L)
// ═══════════════════════════════════════════════════════════════

// Posições dentro de cada seleção (20 figurinhas)
// Posição 1  = Logo/Escudo (FOIL)
// Posição 13 = Foto da Seleção
// Demais     = Jogadores
const LABELS_20 = [
  "Logo (FOIL)",     // 1
  "Jogador",         // 2
  "Jogador",         // 3
  "Jogador",         // 4
  "Jogador",         // 5
  "Jogador",         // 6
  "Jogador",         // 7
  "Jogador",         // 8
  "Jogador",         // 9
  "Jogador",         // 10
  "Jogador",         // 11
  "Jogador",         // 12
  "Foto da Seleção", // 13
  "Jogador",         // 14
  "Jogador",         // 15
  "Jogador",         // 16
  "Jogador",         // 17
  "Jogador",         // 18
  "Jogador",         // 19
  "Jogador",         // 20
];

// Figurinhas de introdução (20 no total)
// Sticker 00 + FWC 1 a FWC 19
const INTRO: { code: string; name: string }[] = [
  { code: "00",     name: "Logo Panini (FOIL)" },
  { code: "FWC 1",  name: "Emblema Oficial (FOIL)" },
  { code: "FWC 2",  name: "Emblema Oficial (FOIL)" },
  { code: "FWC 3",  name: "Mascotes Oficiais (FOIL)" },
  { code: "FWC 4",  name: "Slogan Oficial (FOIL)" },
  { code: "FWC 5",  name: "Bola Oficial (FOIL)" },
  { code: "FWC 6",  name: "Sedes — Canadá (FOIL)" },
  { code: "FWC 7",  name: "Sedes — México (FOIL)" },
  { code: "FWC 8",  name: "Sedes — Estados Unidos (FOIL)" },
  { code: "FWC 9",  name: "Campeão 1934 — Itália" },
  { code: "FWC 10", name: "Campeão 1950 — Uruguai" },
  { code: "FWC 11", name: "Campeão 1954 — Alemanha Ocidental" },
  { code: "FWC 12", name: "Campeão 1962 — Brasil" },
  { code: "FWC 13", name: "Campeão 1974 — Alemanha Ocidental" },
  { code: "FWC 14", name: "Campeão 1986 — Argentina" },
  { code: "FWC 15", name: "Campeão 1994 — Brasil" },
  { code: "FWC 16", name: "Campeão 2002 — Brasil" },
  { code: "FWC 17", name: "Campeão 2006 — Itália" },
  { code: "FWC 18", name: "Campeão 2014 — Alemanha" },
  { code: "FWC 19", name: "Campeão 2022 — Argentina" },
];

// ── 48 seleções na ordem exata do álbum (por grupo A → L) ──────
// [código Panini, nome em português, grupo]
const TEAMS: [string, string, string][] = [
  // Grupo A
  ["MEX", "México",               "A"],
  ["RSA", "África do Sul",        "A"],
  ["KOR", "Coreia do Sul",        "A"],
  ["CZE", "República Tcheca",     "A"],
  // Grupo B
  ["CAN", "Canadá",               "B"],
  ["BIH", "Bósnia e Herzegovina", "B"],
  ["QAT", "Qatar",                "B"],
  ["SUI", "Suíça",                "B"],
  // Grupo C
  ["BRA", "Brasil",               "C"],
  ["MAR", "Marrocos",             "C"],
  ["HAI", "Haiti",                "C"],
  ["SCO", "Escócia",              "C"],
  // Grupo D
  ["USA", "Estados Unidos",       "D"],
  ["PAR", "Paraguai",             "D"],
  ["AUS", "Austrália",            "D"],
  ["TUR", "Turquia",              "D"],
  // Grupo E
  ["GER", "Alemanha",             "E"],
  ["CUW", "Curaçao",              "E"],
  ["CIV", "Costa do Marfim",      "E"],
  ["ECU", "Equador",              "E"],
  // Grupo F
  ["NED", "Holanda",              "F"],
  ["JPN", "Japão",                "F"],
  ["SWE", "Suécia",               "F"],
  ["TUN", "Tunísia",              "F"],
  // Grupo G
  ["BEL", "Bélgica",              "G"],
  ["EGY", "Egito",                "G"],
  ["IRN", "Irã",                  "G"],
  ["NZL", "Nova Zelândia",        "G"],
  // Grupo H
  ["ESP", "Espanha",              "H"],
  ["CPV", "Cabo Verde",           "H"],
  ["KSA", "Arábia Saudita",       "H"],
  ["URU", "Uruguai",              "H"],
  // Grupo I
  ["FRA", "França",               "I"],
  ["SEN", "Senegal",              "I"],
  ["IRQ", "Iraque",               "I"],
  ["NOR", "Noruega",              "I"],
  // Grupo J
  ["ARG", "Argentina",            "J"],
  ["ALG", "Argélia",              "J"],
  ["AUT", "Áustria",              "J"],
  ["JOR", "Jordânia",             "J"],
  // Grupo K
  ["POR", "Portugal",             "K"],
  ["COD", "Congo (RD)",           "K"],
  ["UZB", "Uzbequistão",          "K"],
  ["COL", "Colômbia",             "K"],
  // Grupo L
  ["ENG", "Inglaterra",           "L"],
  ["CRO", "Croácia",              "L"],
  ["GHA", "Gana",                 "L"],
  ["PAN", "Panamá",               "L"],
];

export type StickerTemplate = {
  code: string;
  name: string;
  team: string;
};

export type TeamSection = {
  team: string;
  teamCode: string; // código Panini ex: "BRA", "MEX" — "INTRO" para a introdução
  group: string;    // "A" | "B" | ... | "L" | "Intro"
  stickers: StickerTemplate[];
};

/** Retorna todas as seções na ordem do álbum */
export function getAllSections(): TeamSection[] {
  const sections: TeamSection[] = [];

  // Intro (00 + FWC 1-19)
  sections.push({
    team: "Copa do Mundo 2026",
    teamCode: "INTRO",
    group: "Intro",
    stickers: INTRO.map((intro) => ({
      code: intro.code,
      name: intro.name,
      team: "Copa do Mundo 2026",
    })),
  });

  // Seleções — 20 por time, na ordem dos grupos
  for (const [code, teamName, group] of TEAMS) {
    sections.push({
      team: teamName,
      teamCode: code,
      group,
      stickers: Array.from({ length: 20 }, (_, i) => ({
        code: `${code}${i + 1}`,   // ex: BRA1, BRA2 ... BRA20
        name: LABELS_20[i],
        team: teamName,
      })),
    });
  }

  return sections;
}

/** Todos os templates em lista plana (para compatibilidade) */
export function getAllTemplates(): StickerTemplate[] {
  return getAllSections().flatMap((s) => s.stickers);
}

/** Agrupa por seleção mantendo a ordem do álbum */
export function getTemplatesByTeam(): Map<string, StickerTemplate[]> {
  const map = new Map<string, StickerTemplate[]>();
  for (const s of getAllSections()) {
    map.set(s.team, s.stickers);
  }
  return map;
}

/** Gera stickers prontos para inserir no Supabase */
export function generateAllStickers(albumId: string) {
  return getAllTemplates().map((t) => ({
    ...t,
    quantity: 0,
    status: "disponivel",
    price: 0,
    album_id: albumId,
  }));
}

export const TOTAL_STICKERS = INTRO.length + TEAMS.length * 20;
// 20 intro + 48 × 20 = 980 figurinhas

/**
 * Mapa Panini code → ISO 3166-1 alpha-2 (usado pelo FlagCDN)
 * URL exemplo: https://flagcdn.com/w20/br.png
 */
export const TEAM_ISO: Record<string, string> = {
  INTRO: "",   // sem bandeira — usa ícone de troféu
  // Grupo A
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  // Grupo B
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  // Grupo C
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  // Grupo D
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  // Grupo E
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  // Grupo F
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  // Grupo G
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  // Grupo H
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  // Grupo I
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  // Grupo J
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  // Grupo K
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  // Grupo L
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

/** URL da bandeira pelo código Panini. Tamanho: "w20" | "w40" | "w80" */
export function flagUrl(teamCode: string, size: "w20" | "w40" | "w80" = "w20"): string {
  const iso = TEAM_ISO[teamCode];
  if (!iso) return "";
  return `https://flagcdn.com/${size}/${iso}.png`;
}

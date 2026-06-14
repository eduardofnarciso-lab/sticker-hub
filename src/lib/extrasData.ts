// ─── Figurinhas EXTRAS (especiais) ──────────────────────────────────────────
// Fonte única de verdade. Usada em:
//   - /estoque-extras  (contagem + gestão no admin)
//   - /extras-catalog/$userId  (catálogo público de extras)
// Código no padrão EX<NN>-<RARIDADE>, ex: EX01-O = Vinícius Júnior Ouro.

export type ExtraTemplate = { code: string; name: string };

// Cor por raridade (sufixo do código)
export const rarityColor: Record<string, string> = {
  L: "#A78BFA", // Lilás
  B: "#CD7F32", // Bronze
  P: "#C0C0C0", // Prata
  O: "#FFD700", // Ouro
  R: "#F472B6", // Rosa
};

export const rarityLabel: Record<string, string> = {
  L: "Lilás",
  B: "Bronze",
  P: "Prata",
  O: "Ouro",
  R: "Rosa",
};

export const getRarityKey = (code: string | null | undefined): string =>
  (code ?? "").split("-")[1] ?? "";

export const getRarityColor = (code: string | null | undefined): string =>
  rarityColor[getRarityKey(code)] ?? "#A78BFA";

// Identifica se um código é de figurinha extra
export const isExtraCode = (code: string | null | undefined): boolean =>
  !!code && code.toUpperCase().startsWith("EX");

export const EXTRAS: ExtraTemplate[] = [
  { code: "EX01-L", name: "Vinícius Júnior (Brasil) — Lilás" },
  { code: "EX01-B", name: "Vinícius Júnior (Brasil) — Bronze" },
  { code: "EX01-P", name: "Vinícius Júnior (Brasil) — Prata" },
  { code: "EX01-O", name: "Vinícius Júnior (Brasil) — Ouro" },
  { code: "EX02-L", name: "Moisés Caicedo (Equador) — Lilás" },
  { code: "EX02-B", name: "Moisés Caicedo (Equador) — Bronze" },
  { code: "EX02-P", name: "Moisés Caicedo (Equador) — Prata" },
  { code: "EX02-O", name: "Moisés Caicedo (Equador) — Ouro" },
  { code: "EX03-L", name: "Lamine Yamal (Espanha) — Lilás" },
  { code: "EX03-B", name: "Lamine Yamal (Espanha) — Bronze" },
  { code: "EX03-P", name: "Lamine Yamal (Espanha) — Prata" },
  { code: "EX03-O", name: "Lamine Yamal (Espanha) — Ouro" },
  { code: "EX03-R", name: "Lamine Yamal (Espanha) — Rosa" },
  { code: "EX04-L", name: "Cristiano Ronaldo (Portugal) — Lilás" },
  { code: "EX04-B", name: "Cristiano Ronaldo (Portugal) — Bronze" },
  { code: "EX04-P", name: "Cristiano Ronaldo (Portugal) — Prata" },
  { code: "EX04-O", name: "Cristiano Ronaldo (Portugal) — Ouro" },
  { code: "EX05-L", name: "Florian Wirtz (Alemanha) — Lilás" },
  { code: "EX05-B", name: "Florian Wirtz (Alemanha) — Bronze" },
  { code: "EX05-P", name: "Florian Wirtz (Alemanha) — Prata" },
  { code: "EX05-O", name: "Florian Wirtz (Alemanha) — Ouro" },
  { code: "EX06-L", name: "Luis Díaz (Colômbia) — Lilás" },
  { code: "EX06-B", name: "Luis Díaz (Colômbia) — Bronze" },
  { code: "EX06-P", name: "Luis Díaz (Colômbia) — Prata" },
  { code: "EX06-O", name: "Luis Díaz (Colômbia) — Ouro" },
  { code: "EX07-L", name: "Mohamed Salah (Egito) — Lilás" },
  { code: "EX07-B", name: "Mohamed Salah (Egito) — Bronze" },
  { code: "EX07-P", name: "Mohamed Salah (Egito) — Prata" },
  { code: "EX07-O", name: "Mohamed Salah (Egito) — Ouro" },
  { code: "EX08-L", name: "Alphonso Davies (Canadá) — Lilás" },
  { code: "EX08-B", name: "Alphonso Davies (Canadá) — Bronze" },
  { code: "EX08-P", name: "Alphonso Davies (Canadá) — Prata" },
  { code: "EX08-O", name: "Alphonso Davies (Canadá) — Ouro" },
  { code: "EX09-L", name: "Lionel Messi (Argentina) — Lilás" },
  { code: "EX09-B", name: "Lionel Messi (Argentina) — Bronze" },
  { code: "EX09-P", name: "Lionel Messi (Argentina) — Prata" },
  { code: "EX09-O", name: "Lionel Messi (Argentina) — Ouro" },
  { code: "EX09-R", name: "Lionel Messi (Argentina) — Rosa" },
  { code: "EX10-L", name: "Achraf Hakimi (Marrocos) — Lilás" },
  { code: "EX10-B", name: "Achraf Hakimi (Marrocos) — Bronze" },
  { code: "EX10-P", name: "Achraf Hakimi (Marrocos) — Prata" },
  { code: "EX10-O", name: "Achraf Hakimi (Marrocos) — Ouro" },
  { code: "EX11-L", name: "Jude Bellingham (Inglaterra) — Lilás" },
  { code: "EX11-B", name: "Jude Bellingham (Inglaterra) — Bronze" },
  { code: "EX11-P", name: "Jude Bellingham (Inglaterra) — Prata" },
  { code: "EX11-O", name: "Jude Bellingham (Inglaterra) — Ouro" },
  { code: "EX12-L", name: "Raúl Jiménez (México) — Lilás" },
  { code: "EX12-B", name: "Raúl Jiménez (México) — Bronze" },
  { code: "EX12-P", name: "Raúl Jiménez (México) — Prata" },
  { code: "EX12-O", name: "Raúl Jiménez (México) — Ouro" },
  { code: "EX13-L", name: "Kylian Mbappé (França) — Lilás" },
  { code: "EX13-B", name: "Kylian Mbappé (França) — Bronze" },
  { code: "EX13-P", name: "Kylian Mbappé (França) — Prata" },
  { code: "EX13-O", name: "Kylian Mbappé (França) — Ouro" },
  { code: "EX14-L", name: "Son Heung-min (Coreia do Sul) — Lilás" },
  { code: "EX14-B", name: "Son Heung-min (Coreia do Sul) — Bronze" },
  { code: "EX14-P", name: "Son Heung-min (Coreia do Sul) — Prata" },
  { code: "EX14-O", name: "Son Heung-min (Coreia do Sul) — Ouro" },
  { code: "EX15-L", name: "Erling Haaland (Noruega) — Lilás" },
  { code: "EX15-B", name: "Erling Haaland (Noruega) — Bronze" },
  { code: "EX15-P", name: "Erling Haaland (Noruega) — Prata" },
  { code: "EX15-O", name: "Erling Haaland (Noruega) — Ouro" },
  { code: "EX16-L", name: "Christian Pulisic (Estados Unidos) — Lilás" },
  { code: "EX16-B", name: "Christian Pulisic (Estados Unidos) — Bronze" },
  { code: "EX16-P", name: "Christian Pulisic (Estados Unidos) — Prata" },
  { code: "EX16-O", name: "Christian Pulisic (Estados Unidos) — Ouro" },
  { code: "EX17-L", name: "Cody Gakpo (Holanda) — Lilás" },
  { code: "EX17-B", name: "Cody Gakpo (Holanda) — Bronze" },
  { code: "EX17-P", name: "Cody Gakpo (Holanda) — Prata" },
  { code: "EX17-O", name: "Cody Gakpo (Holanda) — Ouro" },
  { code: "EX18-L", name: "Luka Modrić (Croácia) — Lilás" },
  { code: "EX18-B", name: "Luka Modrić (Croácia) — Bronze" },
  { code: "EX18-P", name: "Luka Modrić (Croácia) — Prata" },
  { code: "EX18-O", name: "Luka Modrić (Croácia) — Ouro" },
  { code: "EX19-L", name: "Federico Valverde (Uruguai) — Lilás" },
  { code: "EX19-B", name: "Federico Valverde (Uruguai) — Bronze" },
  { code: "EX19-P", name: "Federico Valverde (Uruguai) — Prata" },
  { code: "EX19-O", name: "Federico Valverde (Uruguai) — Ouro" },
  { code: "EX19-R", name: "Federico Valverde (Uruguai) — Rosa" },
  { code: "EX20-L", name: "Jérémy Doku (Bélgica) — Lilás" },
  { code: "EX20-B", name: "Jérémy Doku (Bélgica) — Bronze" },
  { code: "EX20-P", name: "Jérémy Doku (Bélgica) — Prata" },
  { code: "EX20-O", name: "Jérémy Doku (Bélgica) — Ouro" },
];

// Número da WhatsApp dedicada às EXTRAS (sem +, com DDI 55)
export const EXTRAS_PHONE = "5515996363938";

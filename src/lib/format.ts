// Preço base pelo código: logo (XX1) e FWC = R$2, demais = R$1
export function stickerPrice(code: string | null | undefined): number {
  if (!code) return 1;
  if (code === "00" || code.startsWith("FWC")) return 2;
  if (/^[A-Z]{2,3}1$/.test(code)) return 2;
  return 1;
}

// Faixas de desconto por volume (qtd total do carrinho)
// 150–249 → normal 0,95 / brilhante 1,95
// 250–499 → normal 0,90 / brilhante 1,90
// 500+    → normal 0,85 / brilhante 1,85
export function discountedPrice(code: string | null | undefined, totalQty: number): number {
  const base = stickerPrice(code);
  const special = base === 2;
  if (totalQty >= 500) return special ? 1.85 : 0.85;
  if (totalQty >= 250) return special ? 1.90 : 0.90;
  if (totalQty >= 150) return special ? 1.95 : 0.95;
  return base;
}

// Rótulo do desconto ativo
export function discountLabel(totalQty: number): { pct: number; label: string } | null {
  if (totalQty >= 500) return { pct: 15, label: "500+ figurinhas — 15% de desconto" };
  if (totalQty >= 250) return { pct: 10, label: "250+ figurinhas — 10% de desconto" };
  if (totalQty >= 150) return { pct: 5,  label: "150+ figurinhas — 5% de desconto" };
  return null;
}

// Formata código: "ALG1" → "ALG 1", "ALG10" → "ALG 10"
export const fmtCode = (code: string | null | undefined): string => {
  if (!code) return "";
  return code.replace(/([A-Za-z]+)(\d)/, "$1 $2");
};

// Substitui "FOIL" por "Brilhante" no nome da figurinha
export const fmtName = (name: string | null | undefined): string => {
  if (!name) return "";
  return name.replace(/\bFOIL\b/gi, "Brilhante");
};

export const brl = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

export const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const categoryLabel: Record<string, string> = {
  copa: "Copa",
  pokemon: "Pokémon",
  tcg: "TCG",
  futebol: "Futebol",
  outro: "Outro",
};

export const conditionLabel: Record<string, string> = {
  nova: "Nova",
  usada: "Usada",
  danificada: "Danificada",
};

export const statusLabel: Record<string, string> = {
  disponivel: "Disponível",
  vendida: "Vendida",
  reservada: "Reservada",
};

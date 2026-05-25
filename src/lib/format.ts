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

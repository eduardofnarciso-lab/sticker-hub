// Tipo de configuracao de preco do vendedor
export interface SellerPricing {
  base_price: number;
  promo_pct: number;
  promo_expires_at: string | null;
}

// Verifica se a promocao esta ativa
export function isPromoActive(pricing: SellerPricing | null | undefined): boolean {
  if (!pricing || pricing.promo_pct <= 0) return false;
  if (!pricing.promo_expires_at) return true;
  return new Date(pricing.promo_expires_at) > new Date();
}

// Preco base hardcoded (compatibilidade com telas internas)
export function stickerPrice(code: string | null | undefined): number {
  if (!code) return 1;
  if (code === "00" || code.startsWith("FWC")) return 2;
  if (/^[A-Z]{2,3}1$/.test(code)) return 2;
  return 1;
}

// Preco usando configuracao do vendedor (catalogo publico)
export function sellerStickerPrice(
  code: string | null | undefined,
  pricing: SellerPricing | null | undefined,
): number {
  const base = pricing?.base_price ?? 1;
  const isSpecial = !code
    ? false
    : code === "00" || code.startsWith("FWC") || /^[A-Z]{2,3}1$/.test(code);
  const unitPrice = isSpecial ? base * 2 : base;
  if (isPromoActive(pricing)) {
    const disc = (pricing!.promo_pct / 100) * unitPrice;
    return Math.max(0.01, Math.round((unitPrice - disc) * 100) / 100);
  }
  return unitPrice;
}

// Desconto por volume sobre preco unitario ja calculado
export function volumeDiscountedPrice(unitPrice: number, totalQty: number): number {
  if (totalQty >= 500) return Math.round(unitPrice * 0.85 * 100) / 100;
  if (totalQty >= 250) return Math.round(unitPrice * 0.90 * 100) / 100;
  if (totalQty >= 150) return Math.round(unitPrice * 0.95 * 100) / 100;
  return unitPrice;
}

// Compatibilidade: discountedPrice para telas internas
export function discountedPrice(code: string | null | undefined, totalQty: number): number {
  return volumeDiscountedPrice(stickerPrice(code), totalQty);
}

// Rotulo do desconto ativo
export function discountLabel(totalQty: number): { pct: number; label: string } | null {
  if (totalQty >= 500) return { pct: 15, label: "500+ figurinhas — 15% de desconto" };
  if (totalQty >= 250) return { pct: 10, label: "250+ figurinhas — 10% de desconto" };
  if (totalQty >= 150) return { pct: 5,  label: "150+ figurinhas — 5% de desconto" };
  return null;
}

export const fmtCode = (code: string | null | undefined): string => {
  if (!code) return "";
  return code.replace(/([A-Za-z]+)(\d)/, "$1 $2");
};

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
  pokemon: "Pokemon",
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
  disponivel: "Disponivel",
  vendida: "Vendida",
  reservada: "Reservada",
};

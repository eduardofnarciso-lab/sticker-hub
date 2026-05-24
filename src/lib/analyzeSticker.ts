// Mock OCR/IA — preparado para integrar com Lovable AI Gateway (Gemini Vision) depois.
// Por enquanto retorna campos vazios para preenchimento manual.

export interface StickerAnalysis {
  code?: string;
  name?: string;
  team?: string;
  confidence: number;
}

export async function analyzeStickerImage(_imageUrl: string): Promise<StickerAnalysis> {
  // TODO: trocar por chamada real ao Lovable AI Gateway (google/gemini-2.5-flash com visão).
  await new Promise((r) => setTimeout(r, 600));
  return {
    code: "",
    name: "",
    team: "",
    confidence: 0,
  };
}

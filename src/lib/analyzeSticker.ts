/**
 * OCR de figurinhas Copa 2026 — v5
 *
 * Pipeline (ordem de prioridade):
 *   1. Groq Vision (llama-3.2-11b) — IA que entende contexto, grátis, direto do browser
 *   2. Tesseract.js — fallback local, sem internet
 *
 * Para ativar o Groq: adicione VITE_GROQ_API_KEY no .env
 */

export interface StickerAnalysis {
  code: string;
  confidence: number;
  debug?: string;
}

// ── Prefixos válidos Copa 2026 ────────────────────────────────────────
const VALID_PREFIXES = new Set([
  "FWC","MEX","RSA","KOR","CZE","CAN","BIH","QAT","SUI",
  "BRA","MAR","HAI","SCO","USA","PAR","AUS","TUR","GER",
  "CIV","ECU","CUW","NED","JPN","TUN","SWE","BEL","EGY",
  "IRN","NZL","ESP","URU","KSA","CPV","FRA","SEN","NOR",
  "IRQ","ARG","AUT","ALG","JOR","COL","POR","UZB","COD",
  "CRO","GHA","ENG","PAN","CC",
]);

const PROMPT =
  `Esta é uma foto de uma figurinha da Copa do Mundo FIFA 2026.
Encontre o código identificador impresso nela. Formato: 2-4 letras maiúsculas + 1-2 dígitos.
Exemplos de códigos válidos: JOR7, FRA01, BRA15, FWC03, ARG10, CC5, JOR07.
O código fica em DESTAQUE no sticker (geralmente no topo ou na lateral).
Ignore textos como "FIFA", "WORLD CUP 2026", "OFFICIAL LICENSED PRODUCT".
Responda SOMENTE o código (sem espaço entre letras e número). Se não houver figurinha visível ou o código não estiver legível, responda: NOT_FOUND`;

// ── Valida e normaliza o código retornado pela IA ─────────────────────
function validateCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  const m = cleaned.match(/^([A-Z]{2,4})(\d{1,2})$/);
  if (!m || !VALID_PREFIXES.has(m[1])) return "";
  return `${m[1]}${m[2].padStart(2, "0")}`;
}

// ── Canvas → JPEG base64 ──────────────────────────────────────────────
function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.82): Promise<string> {
  return new Promise((res, rej) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { rej(new Error("toBlob falhou")); return; }
        const reader = new FileReader();
        reader.onloadend = () => res((reader.result as string).split(",")[1]);
        reader.onerror   = rej;
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

// ── CAMADA 1: Groq Vision direto do browser ───────────────────────────
async function analyzeWithGroq(canvas: HTMLCanvasElement): Promise<StickerAnalysis | null> {
  const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY as string | undefined;
  if (!apiKey) return null; // chave não configurada — pula para Tesseract

  try {
    const image = await canvasToJpeg(canvas);

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens:  20,
        temperature: 0,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
            { type: "text",      text: PROMPT },
          ],
        }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Groq ${resp.status}: ${errText.slice(0, 100)}`);
    }

    const data = await resp.json();
    const raw  = (data.choices?.[0]?.message?.content ?? "NOT_FOUND").trim().toUpperCase();
    const code = validateCode(raw);

    return {
      code,
      confidence: code ? 0.95 : 0,
      debug: `Groq: "${raw}"`,
    };
  } catch (e) {
    console.warn("[Groq] erro:", e);
    return { code: "", confidence: 0, debug: `Groq erro: ${String(e).slice(0, 80)}` };
  }
}

// ── CAMADA 2: Tesseract.js (fallback) ────────────────────────────────
const OCR_FIXES: [RegExp, string][] = [
  [/0/g, "O"], [/O/g, "0"],
  [/1/g, "I"], [/I(?=\d)/g, "1"],
  [/5/g, "S"], [/S(?=\d)/g, "5"],
  [/8/g, "B"], [/B(?=\d)/g, "8"],
  [/4/g, "A"], [/6/g, "G"], [/3/g, "E"],
];

function extractCode(text: string): string {
  const raw = text.toUpperCase().replace(/[^A-Z0-9]/g, " ");
  for (const m of raw.matchAll(/\b([A-Z]{2,4})\s*(\d{1,2})\b/g)) {
    if (VALID_PREFIXES.has(m[1])) return `${m[1]}${m[2].padStart(2, "0")}`;
  }
  return "";
}

function tryFixAndExtract(raw: string): string {
  const direct = extractCode(raw);
  if (direct) return direct;
  const upper = raw.toUpperCase();
  for (const [from, to] of OCR_FIXES) {
    const code = extractCode(upper.replace(from, to));
    if (code) return code;
  }
  return "";
}

function cropStrip(src: HTMLCanvasElement, y0: number, y1: number): HTMLCanvasElement {
  const y = Math.round(src.height * y0), h = Math.round(src.height * (y1 - y0));
  const d = document.createElement("canvas");
  d.width = src.width; d.height = h;
  d.getContext("2d")!.drawImage(src, 0, y, src.width, h, 0, 0, src.width, h);
  return d;
}

function scaleCanvas(src: HTMLCanvasElement, w: number): HTMLCanvasElement {
  if (!src.width || !src.height) return src;
  const d = document.createElement("canvas");
  d.width  = w; d.height = Math.max(1, Math.round(src.height * w / src.width));
  const ctx = d.getContext("2d")!;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, d.width, d.height);
  return d;
}

function binarize(src: HTMLCanvasElement): HTMLCanvasElement {
  const d = document.createElement("canvas");
  d.width = src.width; d.height = src.height;
  const ctx = d.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, d.width, d.height), px = img.data, n = d.width * d.height;
  const gray = new Uint8Array(n);
  for (let i = 0; i < n; i++) gray[i] = Math.round(0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2]);
  const hist = new Array(256).fill(0); for (const v of gray) hist[v]++;
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sb = 0, wb = 0, mx = 0, thr = 128;
  for (let t = 0; t < 256; t++) {
    wb += hist[t]; if (!wb) continue; const wf = n - wb; if (!wf) break;
    sb += t * hist[t];
    const v = wb * wf * ((sb/wb) - ((sum-sb)/wf)) ** 2; if (v > mx) { mx = v; thr = t; }
  }
  let light = 0; const bin = new Uint8Array(n);
  for (let i = 0; i < n; i++) { bin[i] = gray[i] >= thr ? 255 : 0; if (bin[i]) light++; }
  const inv = light < n * 0.5;
  for (let i = 0; i < n; i++) { const v = inv ? 255-bin[i] : bin[i]; px[i*4]=px[i*4+1]=px[i*4+2]=v; px[i*4+3]=255; }
  ctx.putImageData(img, 0, 0); return d;
}

function toGray(src: HTMLCanvasElement): HTMLCanvasElement {
  const d = document.createElement("canvas"); d.width = src.width; d.height = src.height;
  const ctx = d.getContext("2d")!; ctx.filter = "grayscale(1) contrast(1.8)"; ctx.drawImage(src, 0, 0); return d;
}

function toUrl(c: HTMLCanvasElement): Promise<string> {
  return new Promise((res, rej) => c.toBlob((b) => b ? res(URL.createObjectURL(b)) : rej(), "image/png"));
}

let workerPromise: Promise<any> | null = null;
async function getWorker(): Promise<any> {
  if (!workerPromise) workerPromise = (async () => {
    if (!(window as any).Tesseract) await new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      s.onload = () => res(); s.onerror = () => rej(new Error("Falha Tesseract CDN"));
      document.head.appendChild(s);
    });
    const w = await (window as any).Tesseract.createWorker("eng", 1, { logger: () => {} });
    return w;
  })();
  return workerPromise;
}

async function ocr(worker: any, img: HTMLCanvasElement, psm: string): Promise<string> {
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
    tessedit_pageseg_mode: psm, preserve_interword_spaces: "1",
  });
  const url = await toUrl(img);
  try { const { data } = await worker.recognize(url); return (data.text ?? "").trim(); }
  finally { URL.revokeObjectURL(url); }
}

async function analyzeWithTesseract(srcCanvas: HTMLCanvasElement): Promise<StickerAnalysis> {
  const worker = await getWorker();
  // Recorta o centro (70%) onde a figurinha deve estar
  const cx = Math.round(srcCanvas.width * 0.15), cy = Math.round(srcCanvas.height * 0.15);
  const cw = Math.round(srcCanvas.width * 0.70), ch = Math.round(srcCanvas.height * 0.70);
  const center = document.createElement("canvas"); center.width = cw; center.height = ch;
  center.getContext("2d")!.drawImage(srcCanvas, cx, cy, cw, ch, 0, 0, cw, ch);

  const strips = [
    [0.00, 0.28], [0.12, 0.40], [0.32, 0.60], [0.52, 0.80], [0.72, 1.00], [0.00, 1.00],
  ];
  const allTexts: string[] = [];

  for (const [y0, y1] of strips) {
    const strip = scaleCanvas(cropStrip(center, y0, y1), 1600);
    for (const prep of [binarize(strip), toGray(strip)]) {
      for (const psm of ["7", "11"]) {
        if (y0 === 0 && y1 === 1 && psm === "7") continue;
        try {
          const text = await ocr(worker, prep, psm);
          if (text) allTexts.push(text.replace(/\n/g," ").slice(0,30));
          const code = tryFixAndExtract(text);
          if (code) return { code, confidence: 0.7, debug: `Tesseract strip[${y0}-${y1}]/psm${psm}: "${text.replace(/\n/g," ").slice(0,50)}"` };
        } catch (_) {}
      }
    }
  }
  return { code: "", confidence: 0, debug: `Tesseract: ${allTexts.slice(0,3).join(" | ") || "nada"}` };
}

// ── Função principal ──────────────────────────────────────────────────
export async function analyzeCanvas(srcCanvas: HTMLCanvasElement): Promise<StickerAnalysis> {
  // 1. Groq Vision (melhor — entende contexto)
  const groq = await analyzeWithGroq(srcCanvas);
  if (groq?.code) return groq;

  // 2. Tesseract (fallback local)
  return analyzeWithTesseract(srcCanvas);
}

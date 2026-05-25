import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PREFIXES = new Set([
  "FWC","MEX","RSA","KOR","CZE","CAN","BIH","QAT","SUI",
  "BRA","MAR","HAI","SCO","USA","PAR","AUS","TUR","GER",
  "CIV","ECU","CUW","NED","JPN","TUN","SWE","BEL","EGY",
  "IRN","NZL","ESP","URU","KSA","CPV","FRA","SEN","NOR",
  "IRQ","ARG","AUT","ALG","JOR","COL","POR","UZB","COD",
  "CRO","GHA","ENG","PAN","CC",
]);

function validateCode(raw: string): string {
  const m = raw.trim().toUpperCase().match(/^([A-Z]{2,4})\s*(\d{1,2})$/);
  if (!m || !VALID_PREFIXES.has(m[1])) return "";
  return `${m[1]}${m[2].padStart(2, "0")}`;
}

const PROMPT =
  `Esta é uma foto de uma figurinha da Copa do Mundo FIFA 2026.
Encontre o código identificador. O código tem SEMPRE este formato:
- 2 a 4 letras maiúsculas (código do país/time: JOR, FRA, BRA, FWC, CC...)
- seguidas de 1 ou 2 dígitos (ex: 7, 07, 15)
- Exemplos: JOR7, FRA01, BRA15, FWC03, ARG10, CC5

O código é impresso em DESTAQUE no sticker. Ignore texto de rodapé como "FIFA", "WORLD CUP 2026", "OFFICIAL LICENSED PRODUCT".
Responda SOMENTE com o código (letras+número sem espaço). Se não houver figurinha visível ou o código não estiver legível, responda: NOT_FOUND`;

async function callGroq(image: string): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY não configurada");

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
      max_tokens: 20,
      temperature: 0,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
          { type: "text", text: PROMPT },
        ],
      }],
    }),
  });

  if (!resp.ok) throw new Error(`Groq ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  return (data.choices?.[0]?.message?.content ?? "NOT_FOUND").trim().toUpperCase();
}

async function callAnthropic(image: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: PROMPT },
        ],
      }],
    }),
  });

  if (!resp.ok) throw new Error(`Anthropic ${resp.status}`);
  const data = await resp.json();
  return (data.content?.[0]?.text ?? "NOT_FOUND").trim().toUpperCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ code: "", error: "no image" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let raw = "NOT_FOUND";
    let engine = "none";

    // Tenta Groq primeiro (grátis, 30 req/min, sem limite diário)
    try {
      raw    = await callGroq(image);
      engine = "groq";
    } catch (groqErr) {
      console.warn("Groq falhou, tentando Anthropic:", String(groqErr));
      try {
        raw    = await callAnthropic(image);
        engine = "anthropic";
      } catch (anthErr) {
        console.error("Anthropic também falhou:", String(anthErr));
        throw anthErr;
      }
    }

    const code = validateCode(raw);
    console.log(`[${engine}] raw="${raw}" code="${code}"`);

    return new Response(JSON.stringify({ code, engine }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("read-sticker error:", err);
    return new Response(JSON.stringify({ code: "", error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

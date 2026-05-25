import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  Camera, Square, CheckCircle, AlertCircle,
  Loader2, Plus, Minus, Scan, Zap, Play, StopCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { analyzeCanvas } from "@/lib/analyzeSticker";
import { StickerFormDialog, type StickerInput } from "@/components/StickerFormDialog";

export const Route = createFileRoute("/_authenticated/scan")({
  component: ScanPage,
});

type LastResult = {
  code: string; name: string; team: string;
  qty: number; id: string; found: boolean;
} | null;

type ScanEntry = {
  code: string; name: string; qty: number; found: boolean; ts: number;
};

type OverlayState = { type: "found"; code: string; name: string } | { type: "fail" } | null;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function ScanPage() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qc = useQueryClient();

  const [stream, setStream]         = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg]   = useState("");
  const [engine, setEngine]         = useState<"ai" | "ocr" | "">("");

  const [lastResult, setLastResult]   = useState<LastResult>(null);
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);

  // ── Modo automático ───────────────────────────────────────
  const [autoMode, setAutoMode]     = useState(false);
  const [countdown, setCountdown]   = useState(0);
  const [overlay, setOverlay]       = useState<OverlayState>(null);
  const autoStopRef = useRef(false);

  const [dialogOpen, setDialogOpen]       = useState(false);
  const [dialogInitial, setDialogInitial] = useState<Partial<StickerInput> | null>(null);

  // ── Câmera ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      setStream(s);
      setScanning(true);
      setVideoReady(false);
      setStatusMsg("");
    } catch (e) {
      toast.error("Câmera não acessível: " + String(e));
    }
  }, []);

  const stopCamera = useCallback(() => {
    autoStopRef.current = true;
    setAutoMode(false);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setScanning(false);
    setVideoReady(false);
    setStatusMsg("");
    setOverlay(null);
    setCountdown(0);
  }, [stream]);

  useEffect(() => {
    if (scanning && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [scanning, stream]);

  useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()); }, [stream]);

  // ── Lookup no banco ───────────────────────────────────────
  const lookupCode = useCallback(async (code: string): Promise<{ found: boolean; name: string; qty: number; id: string; team: string }> => {
    const { data: rows, error } = await supabase
      .from("stickers")
      .select("id, name, team, quantity")
      .ilike("code", code)
      .limit(1);

    if (error) {
      toast.error(`Erro: ${error.message}`);
      return { found: false, name: "", qty: 0, id: "", team: "" };
    }

    if (rows && rows.length > 0) {
      const s = rows[0];
      const newQty = (s.quantity ?? 0) + 1;
      await supabase.from("stickers").update({ quantity: newQty }).eq("id", s.id);
      qc.invalidateQueries({ queryKey: ["stickers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setLastResult({ code, name: s.name, team: s.team ?? "", qty: newQty, id: s.id, found: true });
      setRecentScans((p) => [{ code, name: s.name, qty: newQty, found: true, ts: Date.now() }, ...p.slice(0, 99)]);
      setStatusMsg(`✅ ${code} — estoque: ${newQty}`);
      toast.success(`✅ ${s.name} (${code}) — estoque: ${newQty}`);
      return { found: true, name: s.name, qty: newQty, id: s.id, team: s.team ?? "" };
    } else {
      setLastResult({ code, name: "Não cadastrada", team: "", qty: 0, id: "", found: false });
      setRecentScans((p) => [{ code, name: "Não cadastrada", qty: 0, found: false, ts: Date.now() }, ...p.slice(0, 99)]);
      setStatusMsg(`⚠️ ${code} não no catálogo`);
      toast.warning(`⚠️ ${code} não está no catálogo`);
      return { found: false, name: "Não cadastrada", qty: 0, id: "", team: "" };
    }
  }, [qc]);

  // ── Core de captura (retorna código ou "") ────────────────
  const doCapture = useCallback(async (): Promise<string> => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoReady) return "";

    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return "";

    canvas.width = vw; canvas.height = vh;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    const result = await analyzeCanvas(canvas);
    console.log("[OCR]", result);

    if (result.code) {
      setEngine(result.debug?.startsWith("Groq") ? "ai" : "ocr");
      return result.code;
    }
    return "";
  }, [videoReady]);

  // ── Captura manual ────────────────────────────────────────
  const capture = useCallback(async () => {
    if (processing || autoMode) return;
    setProcessing(true);
    setStatusMsg("🤖 Analisando...");
    try {
      const code = await doCapture();
      if (code) {
        const { found, name } = await lookupCode(code);
        setOverlay({ type: "found", code, name });
        setTimeout(() => setOverlay(null), 1800);
      } else {
        setOverlay({ type: "fail" });
        setStatusMsg("⚠️ Código não encontrado — tente mais perto");
        setTimeout(() => setOverlay(null), 1200);
      }
    } catch (e) {
      toast.error("Erro: " + String(e));
    } finally {
      setProcessing(false);
    }
  }, [processing, autoMode, doCapture, lookupCode]);

  // Tecla espaço
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.code === "Space" && scanning && videoReady && !processing && !autoMode) {
        e.preventDefault(); capture();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [scanning, videoReady, processing, autoMode, capture]);

  // ── Loop automático ───────────────────────────────────────
  useEffect(() => {
    if (!autoMode || !videoReady || !scanning) return;
    autoStopRef.current = false;

    const loop = async () => {
      while (!autoStopRef.current) {
        setProcessing(true);
        setStatusMsg("🤖 Analisando...");
        setOverlay(null);
        setCountdown(0);

        let code = "";
        try { code = await doCapture(); } catch (_) {}
        setProcessing(false);

        if (autoStopRef.current) break;

        if (code) {
          const { found, name } = await lookupCode(code);
          setOverlay({ type: "found", code, name: found ? name : "Não cadastrada" });
          await sleep(1800);
        } else {
          setOverlay({ type: "fail" });
          setStatusMsg("⚠️ Não lido — mude a posição");
          await sleep(1000);
        }

        if (autoStopRef.current) break;
        setOverlay(null);

        // Contagem regressiva até próxima leitura
        for (let i = 2; i >= 1; i--) {
          if (autoStopRef.current) break;
          setCountdown(i);
          await sleep(1000);
        }
        setCountdown(0);
      }
    };

    loop();
    return () => {
      autoStopRef.current = true;
      setOverlay(null);
      setCountdown(0);
      setProcessing(false);
    };
  }, [autoMode, videoReady, scanning, doCapture, lookupCode]);

  const toggleAuto = () => {
    if (autoMode) {
      autoStopRef.current = true;
      setAutoMode(false);
      setOverlay(null);
      setCountdown(0);
    } else {
      setAutoMode(true);
    }
  };

  // ── Ajuste manual de estoque ──────────────────────────────
  const adjustStock = async (delta: number) => {
    if (!lastResult?.found) return;
    const newQty = Math.max(0, lastResult.qty + delta);
    await supabase.from("stickers").update({ quantity: newQty }).eq("id", lastResult.id);
    setLastResult({ ...lastResult, qty: newQty });
    qc.invalidateQueries({ queryKey: ["stickers"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success(delta > 0 ? `+1 → ${newQty}` : `-1 → ${newQty}`);
  };

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Escanear figurinhas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Segure a figurinha <strong>perto da câmera</strong> com o código visível →{" "}
            <kbd className="px-1 py-0.5 rounded bg-muted text-xs font-mono">Espaço</kbd> ou botão azul.
          </p>
        </div>

        {/* ── Viewfinder ── */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video w-full shadow-xl">
          <video
            ref={videoRef}
            autoPlay playsInline muted
            onLoadedMetadata={() => { const v = videoRef.current; if (v && v.videoWidth > 100) setVideoReady(true); }}
            onPlaying={()        => { const v = videoRef.current; if (v && v.videoWidth > 100) setVideoReady(true); }}
            className="w-full h-full object-cover"
          />

          {/* ── Overlay resultado ── */}
          {overlay?.type === "found" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/80 gap-3 animate-in fade-in duration-200">
              <CheckCircle className="h-20 w-20 text-white drop-shadow" />
              <div className="text-center">
                <div className="text-4xl font-black text-white tracking-widest drop-shadow">{overlay.code}</div>
                <div className="text-white/90 text-lg font-medium mt-1">{overlay.name}</div>
              </div>
            </div>
          )}

          {overlay?.type === "fail" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/75 gap-3 animate-in fade-in duration-200">
              <AlertCircle className="h-20 w-20 text-white drop-shadow" />
              <div className="text-white font-bold text-xl drop-shadow">Não lido</div>
              <div className="text-white/80 text-sm">Ajuste a posição</div>
            </div>
          )}

          {/* Contagem regressiva */}
          {countdown > 0 && !overlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-9xl font-black text-white/60 drop-shadow-lg">{countdown}</div>
            </div>
          )}

          {/* Processing */}
          {processing && !overlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55">
              <Loader2 className="h-14 w-14 text-white animate-spin" />
              <span className="text-white font-semibold">Lendo...</span>
            </div>
          )}

          {/* Câmera parada */}
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85">
              <Camera className="h-16 w-16 text-white/20" />
              <p className="text-white/40 text-sm">Câmera desligada</p>
            </div>
          )}

          {/* Iniciando */}
          {scanning && !videoReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
          )}

          {/* Mira (só quando pronto e sem overlay) */}
          {scanning && videoReady && !processing && !overlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
              <div className="relative w-64 h-44">
                <div className="absolute top-0 left-0  w-8 h-8 border-[3px] border-white rounded-tl-lg border-r-0 border-b-0" />
                <div className="absolute top-0 right-0 w-8 h-8 border-[3px] border-white rounded-tr-lg border-l-0 border-b-0" />
                <div className="absolute bottom-0 left-0  w-8 h-8 border-[3px] border-white rounded-bl-lg border-r-0 border-t-0" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-[3px] border-white rounded-br-lg border-l-0 border-t-0" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
              </div>
              <span className="text-white/60 text-xs bg-black/30 px-2 py-0.5 rounded">
                {autoMode ? "🔄 Modo automático ativo" : "Centralize a figurinha (ex: JOR 7)"}
              </span>
            </div>
          )}

          {/* Badge status */}
          {scanning && videoReady && !processing && (
            <div className={`absolute top-3 left-3 rounded-full px-3 py-1 flex items-center gap-1.5 ${
              autoMode ? "bg-orange-500/80" : "bg-green-600/80"
            }`}>
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-medium">{autoMode ? "Auto" : "Pronto"}</span>
            </div>
          )}

          {/* Engine badge */}
          {engine && scanning && (
            <div className={`absolute top-3 right-3 rounded-full px-3 py-1 flex items-center gap-1.5 ${
              engine === "ai" ? "bg-purple-600/80" : "bg-blue-600/80"
            }`}>
              <Zap className="h-3 w-3 text-white" />
              <span className="text-white text-xs font-medium">{engine === "ai" ? "IA" : "OCR"}</span>
            </div>
          )}
        </div>

        {/* ── Botões ── */}
        {!scanning ? (
          <Button className="w-full h-12 text-base" onClick={startCamera}>
            <Camera className="h-5 w-5 mr-2" /> Ligar câmera
          </Button>
        ) : (
          <div className="flex gap-2">
            {/* Captura manual */}
            <Button
              className="flex-1 h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
              onClick={capture}
              disabled={!videoReady || processing || autoMode}
            >
              {processing && !autoMode
                ? <Loader2 className="h-6 w-6 animate-spin" />
                : <><Scan className="h-5 w-5 mr-2" />Capturar</>}
            </Button>

            {/* Auto scan */}
            <Button
              className={`h-14 px-5 font-bold ${autoMode
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-green-600 hover:bg-green-700"}`}
              onClick={toggleAuto}
              disabled={!videoReady}
            >
              {autoMode
                ? <><StopCircle className="h-5 w-5 mr-1" />Parar</>
                : <><Play className="h-5 w-5 mr-1" />Auto</>}
            </Button>

            {/* Para câmera */}
            <Button variant="destructive" className="h-14 px-4" onClick={stopCamera}>
              <Square className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Status */}
        {statusMsg && !processing && !overlay && (
          <p className="text-xs font-mono text-muted-foreground px-1 break-words">{statusMsg}</p>
        )}

        {/* ── Card último resultado ── */}
        {lastResult && (
          <Card className={`p-4 ${lastResult.found
            ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900"
            : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900"}`}>

            <div className="flex items-center gap-3 mb-3">
              {lastResult.found
                ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                : <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="font-mono font-bold text-base">{lastResult.code}</Badge>
                  <span className="font-semibold text-sm truncate">{lastResult.name}</span>
                </div>
                {lastResult.team && <p className="text-xs text-muted-foreground mt-0.5">{lastResult.team}</p>}
              </div>
            </div>

            {lastResult.found ? (
              <div className="flex items-center justify-center gap-6 py-1">
                <Button size="lg" variant="outline"
                  className="h-14 w-14 rounded-full text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => adjustStock(-1)} disabled={lastResult.qty <= 0}>
                  <Minus className="h-6 w-6" />
                </Button>
                <div className="text-center">
                  <div className="text-4xl font-black tabular-nums">{lastResult.qty}</div>
                  <div className="text-xs text-muted-foreground">em estoque</div>
                </div>
                <Button size="lg" className="h-14 w-14 rounded-full" onClick={() => adjustStock(1)}>
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={() => {
                setDialogInitial({ code: lastResult.code, condition: "nova", quantity: 1, price: 0, status: "disponivel" });
                setDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-1" /> Cadastrar "{lastResult.code}"
              </Button>
            )}
          </Card>
        )}

        {/* ── Histórico da sessão ── */}
        {recentScans.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Sessão ({recentScans.length})
            </p>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {recentScans.map((s) => (
                <div key={s.ts} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                  s.found
                    ? "bg-green-50 border-green-100 dark:bg-green-950/10 dark:border-green-900"
                    : "bg-yellow-50 border-yellow-100 dark:bg-yellow-950/10 dark:border-yellow-900"
                }`}>
                  {s.found
                    ? <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    : <AlertCircle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                  <Badge variant="secondary" className="font-mono text-xs">{s.code}</Badge>
                  <span className="truncate flex-1 text-muted-foreground text-xs">{s.name}</span>
                  {s.found && <span className="text-xs font-bold text-green-700 dark:text-green-400">×{s.qty}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <StickerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={dialogInitial} onSaved={() => {}} />
    </>
  );
}

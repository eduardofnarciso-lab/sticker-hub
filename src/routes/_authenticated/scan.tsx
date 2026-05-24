import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, RotateCcw, Sparkles, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { analyzeStickerImage } from "@/lib/analyzeSticker";
import { StickerFormDialog, type StickerInput } from "@/components/StickerFormDialog";

export const Route = createFileRoute("/_authenticated/scan")({
  component: ScanPage,
});

function ScanPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initial, setInitial] = useState<Partial<StickerInput> | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      // local preview
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      // upload to storage
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Não autenticado");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("sticker-images").upload(path, file);
      if (error) throw error;
      const { data: pub } = supabase.storage.from("sticker-images").getPublicUrl(path);

      // mock OCR analysis
      toast.info("Analisando imagem...");
      const analysis = await analyzeStickerImage(pub.publicUrl);

      setInitial({
        image_url: pub.publicUrl,
        code: analysis.code ?? "",
        name: analysis.name ?? "",
        team: analysis.team ?? "",
        condition: "nova",
        quantity: 1,
        price: 0,
        status: "disponivel",
      });
      setDialogOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao processar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Escanear figurinha</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tire uma foto e revise os dados antes de salvar.
        </p>
      </div>

      <Card className="p-6 shadow-card">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-48 w-48 rounded-2xl bg-muted overflow-hidden flex items-center justify-center border">
            {preview ? (
              <img src={preview} alt="Pré-visualização" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-16 w-16 text-muted-foreground" />
            )}
          </div>

          <div className="w-full max-w-xs space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button
              className="w-full h-12 text-base"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-5 w-5" />
              {preview ? "Tirar outra foto" : "Abrir câmera"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute("capture");
                  fileRef.current.click();
                  // restore for next time
                  setTimeout(() => fileRef.current?.setAttribute("capture", "environment"), 500);
                }
              }}
              disabled={uploading}
            >
              <ImagePlus className="h-4 w-4" />
              Escolher da galeria
            </Button>
            {preview && (
              <Button variant="ghost" className="w-full" onClick={() => setPreview(null)}>
                <RotateCcw className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground max-w-sm flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Reconhecimento por IA será integrado em breve. Por enquanto, preencha os dados manualmente.
          </p>
        </div>
      </Card>

      <StickerFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setPreview(null); }}
        initial={initial}
        onSaved={() => setPreview(null)}
      />
    </div>
  );
}

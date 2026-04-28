"use client";

import { useState } from "react";
import { Download, Share2, Printer, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPDF, sharePDF, printPDF, viewPDF } from "@/lib/pdf-generator";
import type { AssessmentData } from "@/lib/body-assessment-types";
import { saveAvaliacaoLocal, setServerIdForLocalRow } from "@/lib/avaliacoes-store";
import { toast } from "sonner";

interface ActionButtonsProps {
  data: AssessmentData;
}

export function ActionButtons({ data }: ActionButtonsProps) {
  const [salvando, setSalvando] = useState(false);

  const handleDownload = () => {
    downloadPDF(data);
  };

  const handleVisualizar = () => {
    const ok = viewPDF(data);
    if (!ok) {
      toast.error("Não foi possível abrir o PDF. Permita pop-ups neste site ou use Gerar PDF.");
    }
  };

  const handleShare = () => {
    sharePDF(data);
  };

  const handlePrint = () => {
    printPDF(data);
  };

  const handleSalvar = async () => {
    if (!data.resultados) return;
    setSalvando(true);
    try {
      const localId = saveAvaliacaoLocal(data);
      try {
        const res = await fetch("/api/avaliacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const j = (await res.json().catch(() => ({}))) as { id?: number };
          if (typeof j.id === "number") setServerIdForLocalRow(localId, j.id);
          toast.success("Avaliação salva neste aparelho e no servidor.");
          return;
        }
      } catch {
        /* rede / Vercel sem SQLite persistente */
      }
      toast.success("Avaliação salva neste aparelho.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={handleSalvar}
        disabled={!data.resultados || salvando}
        className="flex-1 min-w-[120px]"
        variant="secondary"
      >
        <Save className="w-4 h-4 mr-2" />
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
      <Button
        onClick={handleVisualizar}
        className="flex-1 min-w-[120px]"
        variant="outline"
      >
        <Eye className="w-4 h-4 mr-2" />
        Visualizar PDF
      </Button>
      <Button 
        onClick={handleDownload}
        className="flex-1 min-w-[120px]"
        variant="default"
      >
        <Download className="w-4 h-4 mr-2" />
        Gerar PDF
      </Button>
      
      <Button 
        onClick={handleShare}
        className="flex-1 min-w-[120px]"
        variant="secondary"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Compartilhar
      </Button>
      
      <Button 
        onClick={handlePrint}
        className="flex-1 min-w-[120px]"
        variant="outline"
      >
        <Printer className="w-4 h-4 mr-2" />
        Imprimir
      </Button>
    </div>
  );
}

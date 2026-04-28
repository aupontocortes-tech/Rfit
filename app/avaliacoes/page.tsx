"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResultsDisplay } from "@/components/body-assessment/results-display";
import { ActionButtons } from "@/components/body-assessment/action-buttons";
import type { AssessmentData, AvaliacaoResumo } from "@/lib/body-assessment-types";

export default function AvaliacoesSalvasPage() {
  const [lista, setLista] = useState<AvaliacaoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<AssessmentData | null>(null);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const carregarLista = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/avaliacoes");
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = (await res.json()) as AvaliacaoResumo[];
      setLista(data);
    } catch {
      setErro("Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  async function abrirAvaliacao(id: number) {
    setSheetAberto(true);
    setCarregandoDetalhe(true);
    setSelecionado(null);
    try {
      const res = await fetch(`/api/avaliacoes/${id}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as AssessmentData;
      setSelecionado(data);
    } catch {
      setSelecionado(null);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent shrink-0">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-primary tracking-tight truncate">
                Avaliações salvas
              </h1>
              <p className="text-xs text-muted-foreground">Toque no nome para ver o resultado</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Nova avaliação
            </Link>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-12">
        {loading && (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {erro && !loading && (
          <p className="text-center text-destructive py-8">{erro}</p>
        )}

        {!loading && !erro && lista.length === 0 && (
          <Card className="border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma avaliação salva ainda. Calcule uma avaliação e use &quot;Salvar&quot; na tela de
              resultados.
            </CardContent>
          </Card>
        )}

        {!loading && lista.length > 0 && (
          <Card className="border-border shadow-sm overflow-hidden">
            <ul className="divide-y divide-border">
              {lista.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => abrirAvaliacao(item.id)}
                    className="w-full text-left px-4 md:px-6 py-4 hover:bg-muted/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                  >
                    <span className="font-medium text-foreground">{item.nome}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.data_avaliacao}
                      <span className="hidden sm:inline"> · </span>
                      <span className="sm:inline block text-xs sm:text-sm">
                        registro {item.created_at}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 gap-0 rounded-t-xl">
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border shrink-0 text-left">
            <SheetTitle>
              {selecionado?.cliente.nome ?? "Avaliação"}
            </SheetTitle>
            <SheetDescription>
              {selecionado?.cliente.dataAvaliacao}
              {selecionado?.cliente.avaliador ? ` · ${selecionado.cliente.avaliador}` : null}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 md:p-6 pb-8">
              {carregandoDetalhe && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {!carregandoDetalhe && selecionado?.resultados && (
                <div className="space-y-6">
                  <ResultsDisplay resultados={selecionado.resultados} cliente={selecionado.cliente} />
                  <ActionButtons data={selecionado} />
                </div>
              )}
              {!carregandoDetalhe && !selecionado?.resultados && (
                <p className="text-center text-muted-foreground py-8">Não foi possível carregar esta avaliação.</p>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </main>
  );
}

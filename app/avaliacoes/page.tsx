"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { AvaliacaoResumo, Dobras, Medidas, Resultados } from "@/lib/body-assessment-types";
import {
  deleteAvaliacaoLocal,
  getAvaliacaoStoredRow,
  getServerIdForLocalRow,
  listResumosLocal,
  syncFromServer,
  type AvaliacaoStoredRow,
} from "@/lib/avaliacoes-store";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AssessmentUpsertDialog } from "@/components/body-assessment/assessment-upsert-dialog";

export default function AvaliacoesSalvasPage() {
  const [lista, setLista] = useState<AvaliacaoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [comparacao, setComparacao] = useState<AvaliacaoStoredRow[]>([]);

  const baseRow = comparacao[0] ?? null;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<AvaliacaoStoredRow | null>(null);

  const carregarLista = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      await syncFromServer();
      setLista(listResumosLocal());
    } catch {
      setErro("Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  async function abrirAvaliacao(localId: number) {
    setSheetAberto(true);
    setCarregandoDetalhe(true);
    setComparacao([]);
    try {
      const stored = getAvaliacaoStoredRow(localId);
      if (!stored) {
        setComparacao([]);
        return;
      }
      setComparacao([stored]);
    } catch {
      setComparacao([]);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  const headers = useMemo(() => {
    return comparacao.map((r, i) => ({
      index: i + 1,
      text: `${r.data.cliente.dataAvaliacao}${r.data.cliente.avaliador ? ` · ${r.data.cliente.avaliador}` : ""}`,
    }));
  }, [comparacao]);

  const resultadosFields = useMemo(() => {
    const fields: { key: keyof Resultados; label: string; digits: number }[] = [
      { key: "percentualGordura", label: "Percentual de gordura (%)", digits: 1 },
      { key: "imc", label: "IMC", digits: 2 },
      { key: "rcq", label: "RCQ", digits: 3 },
      { key: "massaGorda", label: "Massa gorda (kg)", digits: 2 },
      { key: "massaMagra", label: "Massa magra (kg)", digits: 2 },
      { key: "somaDobras", label: "Soma dob. (mm)", digits: 1 },
      { key: "densidade", label: "Densidade", digits: 4 },
      { key: "gorduraAPerder", label: "Gordura a perder (kg)", digits: 1 },
    ];
    return fields;
  }, []);

  const dobrasFields = useMemo(() => {
    const fields: { key: keyof Dobras; label: string; digits: number }[] = [
      { key: "peitoral", label: "Peitoral (mm)", digits: 1 },
      { key: "axilarMedia", label: "Axilar média (mm)", digits: 1 },
      { key: "triceps", label: "Tríceps (mm)", digits: 1 },
      { key: "subescapular", label: "Subescapular (mm)", digits: 1 },
      { key: "abdomen", label: "Abdômen (mm)", digits: 1 },
      { key: "supraIliaca", label: "Supra-ilíaca (mm)", digits: 1 },
      { key: "coxa", label: "Coxa (mm)", digits: 1 },
    ];
    return fields;
  }, []);

  const medidasFields = useMemo(() => {
    const fields: { key: keyof Medidas; label: string; digits: number }[] = [
      { key: "ombro", label: "Ombro (cm)", digits: 1 },
      { key: "pescoco", label: "Pescoço (cm)", digits: 1 },
      { key: "toraxRelaxado", label: "Tórax relaxado (cm)", digits: 1 },
      { key: "toraxInspirado", label: "Tórax inspirado (cm)", digits: 1 },
      { key: "abdome", label: "Abdome (cm)", digits: 1 },
      { key: "cintura", label: "Cintura (cm)", digits: 1 },
      { key: "quadril", label: "Quadril (cm)", digits: 1 },
      { key: "antebracoDireito", label: "Antebraço D (cm)", digits: 1 },
      { key: "bracoRelaxadoDireito", label: "Braço relaxado D (cm)", digits: 1 },
      { key: "bracoContraidoDireito", label: "Braço contraído D (cm)", digits: 1 },
      { key: "coxaDireita", label: "Coxa D (cm)", digits: 1 },
      { key: "panturrilhaDireita", label: "Panturrilha D (cm)", digits: 1 },
      { key: "antebracoEsquerdo", label: "Antebraço E (cm)", digits: 1 },
      { key: "bracoRelaxadoEsquerdo", label: "Braço relaxado E (cm)", digits: 1 },
      { key: "bracoContraidoEsquerdo", label: "Braço contraído E (cm)", digits: 1 },
      { key: "coxaEsquerda", label: "Coxa E (cm)", digits: 1 },
      { key: "panturrilhaEsquerda", label: "Panturrilha E (cm)", digits: 1 },
    ];
    return fields;
  }, []);

  const formatCell = (v: number | undefined, digits = 2) => {
    if (!Number.isFinite(v as number)) return "—";
    return (v as number).toFixed(digits);
  };

  async function excluirAvaliacao(localRow: AvaliacaoStoredRow) {
    const serverId = localRow.serverId ?? getServerIdForLocalRow(localRow.id);
    try {
      if (serverId) {
        const res = await fetch(`/api/avaliacoes/${serverId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Falha ao excluir no servidor.");
      }
      deleteAvaliacaoLocal(localRow.id);
      toast.success("Avaliação excluída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir.");
      return;
    }

    setComparacao((prev) => {
      const next = prev.filter((r) => r.id !== localRow.id);
      if (next.length === 0) setSheetAberto(false);
      return next;
    });
    setLista(listResumosLocal());
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
        <SheetContent
          side="bottom"
          className="w-full h-[85vh] sm:h-[90vh] flex flex-col p-0 gap-0 rounded-t-xl overflow-x-hidden"
        >
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border shrink-0 text-left">
            <SheetTitle>{baseRow?.data.cliente.nome ?? "Avaliações"}</SheetTitle>
            <SheetDescription>
              {baseRow?.data.cliente.dataAvaliacao}
              {baseRow?.data.cliente.avaliador ? ` · ${baseRow.data.cliente.avaliador}` : null}
            </SheetDescription>

            {baseRow && (
              <div className="mt-3 flex flex-col sm:flex-row gap-2 pr-10 w-full">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="w-full sm:w-auto">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso vai remover a avaliação do SQLite (quando disponível) e do armazenamento local.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => excluirAvaliacao(baseRow)}
                        className="bg-destructive text-white"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditRow(baseRow)}
                  className="w-full sm:w-auto"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAddDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 md:p-6 pb-8">
              {carregandoDetalhe && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {!carregandoDetalhe && comparacao.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Selecione uma avaliação na lista para comparar.</p>
              )}

              {!carregandoDetalhe && comparacao.length > 0 && baseRow?.data.resultados && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 sm:min-w-[320px]">
                      <ResultsDisplay resultados={baseRow.data.resultados} cliente={baseRow.data.cliente} />
                    </div>
                    <div className="w-full md:w-[360px]">
                      <ActionButtons data={baseRow.data} showSave={false} />
                      <div className="mt-3 text-xs text-muted-foreground">
                        Base da comparação é a primeira avaliação selecionada.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">Avaliações na comparação</h3>
                      <Button size="sm" variant="secondary" onClick={() => setAddDialogOpen(true)} disabled={!baseRow}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar nova avaliação
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {comparacao.map((row, i) => (
                        <Card key={row.id} className="border-border">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-foreground truncate">
                                  {row.data.cliente.dataAvaliacao}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {row.data.cliente.avaliador ? `Avaliador: ${row.data.cliente.avaliador}` : row.data.cliente.nome}
                                </div>
                              </div>
                              {i === 0 && <Badge variant="secondary">Base</Badge>}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditRow(row)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Isso vai remover a avaliação do SQLite (quando disponível) e do armazenamento local.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => excluirAvaliacao(row)}
                                      className="bg-destructive text-white"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <Button size="sm" variant="secondary" onClick={() => setAddDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Números principais</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full sm:min-w-[980px] w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground bg-muted/30">
                            <th className="text-left px-3 py-2 font-medium">Métrica</th>
                            {headers.map((h) => (
                              <th key={h.index} className="px-3 py-2 text-left font-medium sm:whitespace-nowrap">
                                {h.index} · {h.text}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resultadosFields.map((f) => (
                            <tr key={String(f.key)} className="border-t border-border">
                              <td className="px-3 py-2 text-muted-foreground">{f.label}</td>
                              {comparacao.map((r) => (
                                <td key={r.id} className="px-3 py-2 font-medium sm:whitespace-nowrap">
                                  {formatCell(r.data.resultados?.[f.key] as number | undefined, f.digits)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Dobras cutâneas (mm)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full sm:min-w-[980px] w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground bg-muted/30">
                            <th className="text-left px-3 py-2 font-medium">Dobra</th>
                            {headers.map((h) => (
                              <th key={h.index} className="px-3 py-2 text-left font-medium sm:whitespace-nowrap">
                                {h.index} · {h.text}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dobrasFields.map((f) => (
                            <tr key={String(f.key)} className="border-t border-border">
                              <td className="px-3 py-2 text-muted-foreground">{f.label}</td>
                              {comparacao.map((r) => (
                                <td key={r.id} className="px-3 py-2 font-medium sm:whitespace-nowrap">
                                  {formatCell(r.data.dobras?.[f.key] as number | undefined, f.digits)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4 pb-8">
                    <h3 className="text-sm font-semibold text-foreground">Medidas (cm)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full sm:min-w-[980px] w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground bg-muted/30">
                            <th className="text-left px-3 py-2 font-medium">Medida</th>
                            {headers.map((h) => (
                              <th key={h.index} className="px-3 py-2 text-left font-medium sm:whitespace-nowrap">
                                {h.index} · {h.text}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {medidasFields.map((f) => (
                            <tr key={String(f.key)} className="border-t border-border">
                              <td className="px-3 py-2 text-muted-foreground">{f.label}</td>
                              {comparacao.map((r) => (
                                <td key={r.id} className="px-3 py-2 font-medium sm:whitespace-nowrap">
                                  {formatCell(r.data.medidas?.[f.key] as number | undefined, f.digits)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AssessmentUpsertDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        mode="create"
        baseData={baseRow?.data}
        onSaved={(saved) => {
          setComparacao((prev) => {
            const exists = prev.some((r) => r.id === saved.id);
            if (exists) return prev.map((r) => (r.id === saved.id ? saved : r));
            return [...prev, saved];
          });
          setLista(listResumosLocal());
        }}
      />

      {editRow && (
        <AssessmentUpsertDialog
          open={!!editRow}
          onOpenChange={(o) => {
            if (!o) setEditRow(null);
          }}
          mode="edit"
          localId={editRow.id}
          serverId={editRow.serverId ?? getServerIdForLocalRow(editRow.id)}
          initialData={editRow.data}
          baseData={baseRow?.data}
          onSaved={(saved) => {
            setComparacao((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
            setLista(listResumosLocal());
            setEditRow(null);
          }}
        />
      )}
    </main>
  );
}

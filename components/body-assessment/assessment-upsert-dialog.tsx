"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calculator,
  Pencil,
  Plus,
  Save,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import type { AssessmentData, ClientData, Dobras, Medidas, Resultados } from "@/lib/body-assessment-types";
import { calcularResultados } from "@/lib/body-assessment-calculations";
import { ClientDataForm } from "@/components/body-assessment/client-data-form";
import { SkinfoldForm } from "@/components/body-assessment/skinfold-form";
import { MeasurementsForm } from "@/components/body-assessment/measurements-form";
import { ResultsDisplay } from "@/components/body-assessment/results-display";
import type { AvaliacaoStoredRow } from "@/lib/avaliacoes-store";
import {
  getAvaliacaoStoredRow,
  saveAvaliacaoLocal,
  setServerIdForLocalRow,
  updateAvaliacaoLocal,
} from "@/lib/avaliacoes-store";

type UpsertMode = "create" | "edit";

type CommonProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: UpsertMode;
  baseData?: AssessmentData;
  onSaved: (saved: AvaliacaoStoredRow) => void;
};

type CreateProps = CommonProps & {
  mode: "create";
};

type EditProps = CommonProps & {
  mode: "edit";
  localId: number;
  serverId?: number | null;
  initialData: AssessmentData;
};

type Props = CreateProps | EditProps;

function normalizarAlturaCm(altura: number): number {
  if (!Number.isFinite(altura) || altura <= 0) return 0;
  // altura pode vir em cm (ex: 175) ou em metros (ex: 1.75)
  return altura <= 3 ? altura * 100 : altura;
}

function formatOrDash(v: number | undefined, digits = 2) {
  if (!Number.isFinite(v as number)) return "—";
  return (v as number).toFixed(digits);
}

function TwoColumnList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; a: string; b: string }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr] text-xs font-medium text-muted-foreground bg-muted/30">
          <div className="px-3 py-2">Medida</div>
          <div className="px-3 py-2">1a</div>
          <div className="px-3 py-2">2a</div>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[1fr_1fr_1fr] text-sm">
              <div className="px-3 py-2 text-muted-foreground">{r.label}</div>
              <div className="px-3 py-2 font-medium">{r.a}</div>
              <div className="px-3 py-2 font-medium">{r.b}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AssessmentUpsertDialog(props: Props) {
  const initialClient: ClientData = useMemo(() => {
    if (props.mode === "edit") return props.initialData.cliente;
    const today = new Date();
    return {
      nome: "",
      sexo: "masculino",
      idade: 0,
      peso: 0,
      altura: 0,
      dataAvaliacao: today.toLocaleDateString("pt-BR"),
      avaliador: "",
    };
  }, [props]);

  const initialDobras: Dobras = useMemo(() => {
    if (props.mode === "edit") return props.initialData.dobras;
    return {
      peitoral: 0,
      axilarMedia: 0,
      triceps: 0,
      subescapular: 0,
      abdomen: 0,
      supraIliaca: 0,
      coxa: 0,
    };
  }, [props]);

  const initialMedidas: Medidas = useMemo(() => {
    if (props.mode === "edit") return props.initialData.medidas;
    return {
      ombro: 0,
      pescoco: 0,
      toraxRelaxado: 0,
      toraxInspirado: 0,
      abdome: 0,
      cintura: 0,
      quadril: 0,
      antebracoDireito: 0,
      bracoRelaxadoDireito: 0,
      bracoContraidoDireito: 0,
      coxaDireita: 0,
      panturrilhaDireita: 0,
      antebracoEsquerdo: 0,
      bracoRelaxadoEsquerdo: 0,
      bracoContraidoEsquerdo: 0,
      coxaEsquerda: 0,
      panturrilhaEsquerda: 0,
    };
  }, [props]);

  const [activeTab, setActiveTab] = useState<"dados" | "dobras" | "medidas" | "resultado">("dados");
  const [clientData, setClientData] = useState<ClientData>(initialClient);
  const [dobras, setDobras] = useState<Dobras>(initialDobras);
  const [medidas, setMedidas] = useState<Medidas>(initialMedidas);
  const [resultados, setResultados] = useState<Resultados | null>(props.mode === "edit" ? props.initialData.resultados ?? null : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculando, setCalculando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const openInitRef = useRef(false);
  useEffect(() => {
    if (props.open) {
      if (openInitRef.current) return;
      openInitRef.current = true;
      setActiveTab("dados");
      setErrors({});
      setCalculando(false);
      setSalvando(false);
      setClientData(initialClient);
      setDobras(initialDobras);
      setMedidas(initialMedidas);
      setResultados(props.mode === "edit" ? props.initialData.resultados ?? null : null);
      return;
    }
    openInitRef.current = false;
  }, [props.open]);

  const validateClientData = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!clientData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!clientData.sexo) newErrors.sexo = "Sexo é obrigatório";
    if (!clientData.idade || clientData.idade <= 0) newErrors.idade = "Idade inválida";
    if (!clientData.peso || clientData.peso <= 0) newErrors.peso = "Peso inválido";
    const alturaCm = normalizarAlturaCm(clientData.altura);
    if (!alturaCm) newErrors.altura = "Altura inválida";
    else if (alturaCm < 100 || alturaCm > 250) newErrors.altura = "Altura fora da faixa esperada (100 a 250 cm)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDobras = (): boolean => {
    const newErrors: Record<string, string> = {};
    (Object.keys(dobras) as (keyof Dobras)[]).forEach((key) => {
      const value = dobras[key] ?? 0;
      if (value < 0) newErrors[String(key)] = "Valor não pode ser negativo";
    });
    const hasAnyValue = Object.values(dobras).some((v) => (v ?? 0) > 0);
    if (!hasAnyValue) newErrors.general = "Preencha pelo menos uma dobra cutânea";
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateMedidas = (): boolean => {
    const newErrors: Record<string, string> = {};
    (Object.keys(medidas) as (keyof Medidas)[]).forEach((key) => {
      const value = medidas[key] ?? 0;
      if (value < 0) newErrors[String(key)] = "Valor não pode ser negativo";
    });
    if (!medidas.cintura || medidas.cintura <= 0) newErrors.cintura = "Cintura é obrigatória para cálculo do RCQ";
    if (!medidas.quadril || medidas.quadril <= 0) newErrors.quadril = "Quadril é obrigatório para cálculo do RCQ";
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleCalcular = async () => {
    if (!validateClientData() || !validateDobras() || !validateMedidas()) return;
    setCalculando(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const result = calcularResultados(clientData, dobras, medidas);
      setResultados(result);
      setActiveTab("resultado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível calcular");
    } finally {
      setCalculando(false);
    }
  };

  const comparisonPreview = useMemo(() => {
    if (!props.baseData || !resultados) return null;
    const base = props.baseData;
    const candidate: AssessmentData = {
      cliente: clientData,
      dobras,
      medidas,
      resultados,
    };

    const metricsRows = [
      { label: "Percentual de Gordura (%)", a: formatOrDash(base.resultados?.percentualGordura, 1), b: formatOrDash(candidate.resultados.percentualGordura, 1) },
      { label: "IMC", a: formatOrDash(base.resultados?.imc, 2), b: formatOrDash(candidate.resultados.imc, 2) },
      { label: "RCQ", a: formatOrDash(base.resultados?.rcq, 3), b: formatOrDash(candidate.resultados.rcq, 3) },
      { label: "Massa Gorda (kg)", a: formatOrDash(base.resultados?.massaGorda, 2), b: formatOrDash(candidate.resultados.massaGorda, 2) },
      { label: "Massa Magra (kg)", a: formatOrDash(base.resultados?.massaMagra, 2), b: formatOrDash(candidate.resultados.massaMagra, 2) },
      { label: "Soma Dobras (mm)", a: formatOrDash(base.resultados?.somaDobras, 1), b: formatOrDash(candidate.resultados.somaDobras, 1) },
      { label: "Densidade", a: formatOrDash(base.resultados?.densidade, 4), b: formatOrDash(candidate.resultados.densidade, 4) },
    ];

    const measuresFields: { key: keyof Medidas; label: string; digits: number }[] = [
      { key: "ombro", label: "Ombro", digits: 1 },
      { key: "pescoco", label: "Pescoço", digits: 1 },
      { key: "toraxRelaxado", label: "Tórax Relaxado", digits: 1 },
      { key: "toraxInspirado", label: "Tórax Inspirado", digits: 1 },
      { key: "abdome", label: "Abdome", digits: 1 },
      { key: "cintura", label: "Cintura", digits: 1 },
      { key: "quadril", label: "Quadril", digits: 1 },
      { key: "antebracoDireito", label: "Antebraço D", digits: 1 },
      { key: "bracoRelaxadoDireito", label: "Braço Relaxado D", digits: 1 },
      { key: "bracoContraidoDireito", label: "Braço Contraído D", digits: 1 },
      { key: "coxaDireita", label: "Coxa D", digits: 1 },
      { key: "panturrilhaDireita", label: "Panturrilha D", digits: 1 },
      { key: "antebracoEsquerdo", label: "Antebraço E", digits: 1 },
      { key: "bracoRelaxadoEsquerdo", label: "Braço Relaxado E", digits: 1 },
      { key: "bracoContraidoEsquerdo", label: "Braço Contraído E", digits: 1 },
      { key: "coxaEsquerda", label: "Coxa E", digits: 1 },
      { key: "panturrilhaEsquerda", label: "Panturrilha E", digits: 1 },
    ];

    const measuresRows = measuresFields.map((f) => ({
      label: f.label,
      a: formatOrDash(base.medidas[f.key], f.digits),
      b: formatOrDash(candidate.medidas[f.key], f.digits),
    }));

    return { metricsRows, measuresRows };
  }, [props.baseData, resultados, clientData, dobras, medidas]);

  const handleSalvar = async () => {
    if (!resultados) return;

    const payload: AssessmentData = {
      cliente: clientData,
      dobras,
      medidas,
      resultados,
    };

    setSalvando(true);
    try {
      if (props.mode === "create") {
        const localId = saveAvaliacaoLocal(payload);
        let serverId: number | null = null;
        try {
          const res = await fetch("/api/avaliacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const j = (await res.json().catch(() => ({}))) as { id?: number };
            if (typeof j.id === "number") {
              serverId = j.id;
              setServerIdForLocalRow(localId, j.id);
            }
          }
        } catch {
          // rede / Vercel sem SQLite persistente
        }

        const stored = getAvaliacaoStoredRow(localId) ?? {
          id: localId,
          serverId: serverId ?? undefined,
          created_at: new Date().toISOString(),
          data: payload,
        };
        toast.success(serverId ? "Avaliação salva e persistida no servidor." : "Avaliação salva neste aparelho.");
        props.onSaved(stored);
        props.onOpenChange(false);
        return;
      }

      // edit
      const localId = props.localId;
      updateAvaliacaoLocal(localId, payload);

      let serverId: number | null = props.serverId ?? null;
      try {
        if (serverId) {
          const res = await fetch(`/api/avaliacoes/${serverId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Falha ao atualizar no servidor.");
        } else {
          // avaliação ainda não tinha sido persistida no SQLite
          const res = await fetch(`/api/avaliacoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const j = (await res.json().catch(() => ({}))) as { id?: number };
            if (typeof j.id === "number") {
              serverId = j.id;
              setServerIdForLocalRow(localId, j.id);
            }
          }
        }
      } catch {
        // mantemos o que foi salvo localmente
      }

      const stored = getAvaliacaoStoredRow(localId) ?? {
        id: localId,
        serverId: serverId ?? undefined,
        created_at: new Date().toISOString(),
        data: payload,
      };
      toast.success("Avaliação atualizada.");
      props.onSaved(stored);
      props.onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[980px] p-0 overflow-hidden max-h-[90vh]">
        <div className="p-4 sm:p-6 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {props.mode === "create" ? <Plus className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
              {props.mode === "create" ? "Adicionar nova avaliação para comparar" : "Editar avaliação"}
            </DialogTitle>
            <DialogDescription>
              {props.mode === "create"
                ? "Primeira avaliação (base) versus a avaliação que você vai adicionar."
                : "Recalcule e salve para atualizar os números."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="dobras">Dobras</TabsTrigger>
              <TabsTrigger value="medidas">Medidas</TabsTrigger>
              <TabsTrigger value="resultado">Resultado</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="mt-4">
              <ClientDataForm data={clientData} onChange={setClientData} errors={errors} />
            </TabsContent>

            <TabsContent value="dobras" className="mt-4">
              <SkinfoldForm data={dobras} onChange={setDobras} errors={errors} />
            </TabsContent>

            <TabsContent value="medidas" className="mt-4">
              <MeasurementsForm data={medidas} onChange={setMedidas} errors={errors} />
            </TabsContent>

            <TabsContent value="resultado" className="mt-4">
              {resultados ? (
                <div className="space-y-6">
                  <ResultsDisplay resultados={resultados} cliente={clientData} />
                  {comparisonPreview && (
                    <div className="space-y-6">
                      <Card className="border-border p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                          Prévia: base (1) x nova avaliação (2)
                        </div>
                        <TwoColumnList title="Números principais" rows={comparisonPreview.metricsRows} />
                        <div className="h-4" />
                        <TwoColumnList title="Medidas (cm)" rows={comparisonPreview.measuresRows} />
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
                  Calcule a avaliação para ver o resultado.
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button
              onClick={handleCalcular}
              disabled={calculando}
              className="flex-1 min-w-[160px] sm:min-w-[220px]"
              variant="outline"
            >
              {calculando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculando…
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular Avaliação
                </>
              )}
            </Button>

            <Button
              onClick={handleSalvar}
              disabled={!resultados || salvando}
              className="flex-1 min-w-[160px] sm:min-w-[220px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {salvando ? "Salvando…" : props.mode === "create" ? "Salvar e adicionar" : "Salvar alterações"}
            </Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            {props.mode === "create"
              ? "Ao salvar, o item entra na lista de comparação dentro da tela de avaliações salvas."
              : "Ao salvar, a avaliação editada é atualizada tanto localmente quanto no SQLite (quando disponível)."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Activity, ChevronRight, ChevronLeft, Calculator, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientDataForm } from "@/components/body-assessment/client-data-form";
import { SkinfoldForm } from "@/components/body-assessment/skinfold-form";
import { MeasurementsForm } from "@/components/body-assessment/measurements-form";
import { ResultsDisplay } from "@/components/body-assessment/results-display";
import { ActionButtons } from "@/components/body-assessment/action-buttons";
import { calcularResultados } from "@/lib/body-assessment-calculations";
import type { ClientData, Dobras, Medidas, Resultados, AssessmentData } from "@/lib/body-assessment-types";
import { Spinner } from "@/components/ui/spinner";

const tabs = ["dados", "dobras", "medidas", "resultado"] as const;
type TabValue = (typeof tabs)[number];

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function normalizarAlturaCm(altura: number): number {
  if (!Number.isFinite(altura) || altura <= 0) return 0;
  return altura <= 3 ? altura * 100 : altura;
}

export default function BodyAssessmentPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("dados");
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const [clientData, setClientData] = useState<ClientData>({
    nome: "",
    sexo: "masculino",
    idade: 0,
    peso: 0,
    altura: 0,
    dataAvaliacao: formatDate(new Date()),
    avaliador: "",
  });

  const [dobras, setDobras] = useState<Dobras>({
    peitoral: 0,
    axilarMedia: 0,
    triceps: 0,
    subescapular: 0,
    abdomen: 0,
    supraIliaca: 0,
    coxa: 0,
  });

  const [medidas, setMedidas] = useState<Medidas>({
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
  });

  const [resultados, setResultados] = useState<Resultados | null>(null);

  const validateClientData = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!clientData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    if (!clientData.sexo) {
      newErrors.sexo = "Sexo é obrigatório";
    }
    if (!clientData.idade || clientData.idade <= 0) {
      newErrors.idade = "Idade inválida";
    }
    if (!clientData.peso || clientData.peso <= 0) {
      newErrors.peso = "Peso inválido";
    }
    const alturaCm = normalizarAlturaCm(clientData.altura);
    if (!alturaCm) {
      newErrors.altura = "Altura inválida";
    } else if (alturaCm < 100 || alturaCm > 250) {
      newErrors.altura = "Altura fora da faixa esperada (100 a 250 cm)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDobras = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.entries(dobras).forEach(([key, value]) => {
      if (value < 0) {
        newErrors[key] = "Valor não pode ser negativo";
      }
    });

    const hasAnyValue = Object.values(dobras).some(v => v > 0);
    if (!hasAnyValue) {
      newErrors.general = "Preencha pelo menos uma dobra cutânea";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMedidas = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.entries(medidas).forEach(([key, value]) => {
      if (value < 0) {
        newErrors[key] = "Valor não pode ser negativo";
      }
    });

    if (!medidas.cintura || medidas.cintura <= 0) {
      newErrors.cintura = "Cintura é obrigatória para cálculo do RCQ";
    }
    if (!medidas.quadril || medidas.quadril <= 0) {
      newErrors.quadril = "Quadril é obrigatório para cálculo do RCQ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentIndex = tabs.indexOf(activeTab);
    
    if (activeTab === "dados" && !validateClientData()) return;
    if (activeTab === "dobras" && !validateDobras()) return;
    if (activeTab === "medidas" && !validateMedidas()) return;

    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
      setErrors({});
    }
  };

  const handleCalculate = async () => {
    if (!validateClientData() || !validateDobras() || !validateMedidas()) {
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = calcularResultados(clientData, dobras, medidas);
    setResultados(result);
    setShowResults(true);
    setActiveTab("resultado");
    setIsCalculating(false);
  };

  const assessmentData: AssessmentData = useMemo(() => ({
    cliente: clientData,
    dobras,
    medidas,
    resultados: resultados ?? undefined,
  }), [clientData, dobras, medidas, resultados]);

  const currentTabIndex = tabs.indexOf(activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastInputTab = currentTabIndex === 2;
  const isResultTab = activeTab === "resultado";

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent shrink-0">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-primary tracking-tight">RFIT</h1>
                <p className="text-xs text-muted-foreground">Avaliação Corporal Profissional</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/avaliacoes">
                <List className="w-4 h-4 mr-2" />
                Salvas
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2">
          <div className="flex items-center gap-2">
            {tabs.map((tab, index) => (
              <div key={tab} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    index <= currentTabIndex
                      ? "bg-gradient-to-r from-primary to-accent shadow-sm"
                      : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Dados</span>
            <span>Dobras</span>
            <span>Medidas</span>
            <span>Resultado</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-32">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="hidden">
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6 md:p-8">
              <TabsContent value="dados" className="mt-0">
                <ClientDataForm
                  data={clientData}
                  onChange={setClientData}
                  errors={errors}
                />
              </TabsContent>

              <TabsContent value="dobras" className="mt-0">
                <SkinfoldForm
                  data={dobras}
                  onChange={setDobras}
                  errors={errors}
                />
              </TabsContent>

              <TabsContent value="medidas" className="mt-0">
                <MeasurementsForm
                  data={medidas}
                  onChange={setMedidas}
                  errors={errors}
                />
              </TabsContent>

              <TabsContent value="resultado" className="mt-0">
                {resultados ? (
                  <div className="space-y-6">
                    <ResultsDisplay
                      resultados={resultados}
                      cliente={clientData}
                    />
                    <ActionButtons data={assessmentData} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Preencha todos os dados e clique em calcular para ver os resultados
                    </p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-6xl mx-auto flex gap-3">
          {!isFirstTab && !isResultTab && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
          )}
          
          {isResultTab && showResults && (
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab("dados");
                setShowResults(false);
              }}
              className="flex-1"
            >
              Nova Avaliação
            </Button>
          )}

          {!isResultTab && (
            <>
              {isLastInputTab ? (
                <Button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="flex-1"
                >
                  {isCalculating ? (
                    <>
                      <Spinner className="mr-2" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calcular Avaliação
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} className="flex-1 -translate-y-12">
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import { Activity, Scale, Target, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import type { Resultados, ClientData } from "@/lib/body-assessment-types";
import { cn } from "@/lib/utils";
import { PieChart3D } from "./pie-chart-3d";

interface ResultsDisplayProps {
  resultados: Resultados;
  cliente: ClientData;
}

function getGorduraColor(classificacao: string) {
  switch (classificacao) {
    case "Ideal":
      return "text-accent bg-accent/10 border-accent/20";
    case "Muito baixo":
      return "text-warning bg-warning/10 border-warning/20";
    case "Acima do ideal":
      return "text-chart-3 bg-chart-3/10 border-chart-3/20";
    case "Obesidade":
      return "text-destructive bg-destructive/10 border-destructive/20";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function getRCQColor(classificacao: string) {
  switch (classificacao) {
    case "Baixo risco":
      return "text-accent bg-accent/10 border-accent/20";
    case "Risco moderado":
      return "text-chart-3 bg-chart-3/10 border-chart-3/20";
    case "Alto risco":
      return "text-destructive bg-destructive/10 border-destructive/20";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function getGorduraIcon(classificacao: string) {
  switch (classificacao) {
    case "Ideal":
      return <CheckCircle className="w-5 h-5" />;
    case "Muito baixo":
    case "Acima do ideal":
    case "Obesidade":
      return <AlertTriangle className="w-5 h-5" />;
    default:
      return null;
  }
}

export function ResultsDisplay({ resultados, cliente }: ResultsDisplayProps) {
  const percentualDisplay = resultados.percentualGordura.toFixed(1);
  const metaMedia = (resultados.metaPercentual.min + resultados.metaPercentual.max) / 2;
  const diferencaParaMeta = resultados.percentualGordura - metaMedia;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Resultados da Avaliação</h2>
          <p className="text-sm text-muted-foreground">{cliente.nome} • {cliente.dataAvaliacao}</p>
        </div>
      </div>

      {/* Main Result - Body Fat Percentage */}
      <div className="p-6 rounded-xl bg-primary text-primary-foreground text-center">
        <p className="text-sm font-medium opacity-90 mb-2">Percentual de Gordura</p>
        <p className="text-5xl font-bold mb-2">{percentualDisplay}%</p>
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
          getGorduraColor(resultados.classificacaoGordura)
        )}>
          {getGorduraIcon(resultados.classificacaoGordura)}
          {resultados.classificacaoGordura}
        </div>
      </div>

      {/* IMC and TMB */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <span className="text-sm text-muted-foreground">IMC</span>
          <p className="text-2xl font-bold text-foreground">{resultados.imc.toFixed(2)}</p>
          <span className="text-xs text-muted-foreground">{resultados.classificacaoIMC}</span>
        </div>
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm text-muted-foreground">TMB</span>
          <p className="text-2xl font-bold text-primary">{resultados.tmb.toFixed(0)} kcal</p>
          <span className="text-xs text-muted-foreground">Taxa Metabólica Basal</span>
        </div>
      </div>

      {/* 3D Pie Chart - Body Composition */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4 text-center">Composição corporal (3D)</h3>
        <PieChart3D
          massaMagra={resultados.massaMagra}
          massaGorda={resultados.massaGorda}
          percentualGordura={resultados.percentualGordura}
        />
      </div>

      {/* Body Composition Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
            <span className="text-sm text-muted-foreground">Massa Magra</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{resultados.massaMagra.toFixed(2)} kg</p>
          <p className="text-xs text-muted-foreground">{(100 - resultados.percentualGordura).toFixed(2)}%</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-sm text-muted-foreground">Massa Gorda</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{resultados.massaGorda.toFixed(2)} kg</p>
          <p className="text-xs text-muted-foreground">{resultados.percentualGordura.toFixed(2)}%</p>
        </div>
      </div>

      {/* RCQ */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Relação Cintura-Quadril (RCQ)</p>
            <p className="text-2xl font-bold text-foreground">{resultados.rcq.toFixed(3)}</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
            getRCQColor(resultados.classificacaoRCQ)
          )}>
            {resultados.classificacaoRCQ === "Baixo risco" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {resultados.classificacaoRCQ}
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Metas Recomendadas</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">% Gordura Ideal ({cliente.sexo === "masculino" ? "Masculino" : "Feminino"})</span>
            <span className="font-medium text-foreground">{resultados.metaPercentual.min}% - {resultados.metaPercentual.max}%</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Peso Alvo</span>
            <span className="font-medium text-foreground">{resultados.pesoAlvo.toFixed(1)} kg</span>
          </div>
          {resultados.gorduraAPerder > 0 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Gordura a Perder
              </span>
              <span className="font-bold text-accent">{resultados.gorduraAPerder.toFixed(1)} kg</span>
            </div>
          )}
          {diferencaParaMeta > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 mt-2">
              <p className="text-sm text-foreground">
                Para atingir a meta média de <strong>{metaMedia.toFixed(0)}%</strong>, 
                você precisa reduzir <strong>{diferencaParaMeta.toFixed(1)} pontos percentuais</strong> de gordura corporal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-secondary/50">
        <h3 className="font-medium text-foreground mb-2">Resumo dos Dados</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Soma Dobras:</span>
            <span className="font-medium text-foreground">{resultados.somaDobras.toFixed(1)} mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Densidade:</span>
            <span className="font-medium text-foreground">{resultados.densidade.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

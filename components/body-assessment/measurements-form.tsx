"use client";

import { Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Medidas } from "@/lib/body-assessment-types";

interface MeasurementsFormProps {
  data: Medidas;
  onChange: (data: Medidas) => void;
  errors: Record<string, string>;
}

export function MeasurementsForm({ data, onChange, errors }: MeasurementsFormProps) {
  const handleChange = (field: keyof Medidas, value: number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Ruler className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Perímetros</h2>
          <p className="text-sm text-muted-foreground">Circunferências em centímetros (cm)</p>
        </div>
      </div>

      {/* Tronco */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tronco</h3>
        <div className="grid gap-3">
          {[
            { key: "ombro", label: "Ombro" },
            { key: "pescoco", label: "Pescoço" },
            { key: "toraxRelaxado", label: "Tórax Relaxado" },
            { key: "toraxInspirado", label: "Tórax Inspirado" },
            { key: "abdome", label: "Abdome" },
            { key: "cintura", label: "Cintura" },
            { key: "quadril", label: "Quadril" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <Label htmlFor={key} className="text-sm font-medium text-foreground">
                {label}
              </Label>
              <div className="w-24">
                <Input
                  id={key}
                  type="number"
                  placeholder="cm"
                  step="0.1"
                  min={0}
                  value={data[key as keyof Medidas] || ""}
                  onChange={(e) => handleChange(key as keyof Medidas, Number(e.target.value))}
                  className={`text-center ${errors[key] ? "border-destructive" : ""}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Membros Superiores */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Membros Superiores</h3>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-muted-foreground px-3">
          <div></div>
          <div>Direito</div>
          <div>Esquerdo</div>
        </div>
        <div className="grid gap-3">
          {[
            { label: "Antebraço", dirKey: "antebracoDireito", esqKey: "antebracoEsquerdo" },
            { label: "Braço Relaxado", dirKey: "bracoRelaxadoDireito", esqKey: "bracoRelaxadoEsquerdo" },
            { label: "Braço Contraído", dirKey: "bracoContraidoDireito", esqKey: "bracoContraidoEsquerdo" },
          ].map(({ label, dirKey, esqKey }) => (
            <div key={label} className="grid grid-cols-3 gap-2 items-center p-3 rounded-lg bg-secondary/50">
              <Label className="text-sm font-medium text-foreground">{label}</Label>
              <Input
                type="number"
                placeholder="cm"
                step="0.1"
                min={0}
                value={data[dirKey as keyof Medidas] || ""}
                onChange={(e) => handleChange(dirKey as keyof Medidas, Number(e.target.value))}
                className="text-center"
              />
              <Input
                type="number"
                placeholder="cm"
                step="0.1"
                min={0}
                value={data[esqKey as keyof Medidas] || ""}
                onChange={(e) => handleChange(esqKey as keyof Medidas, Number(e.target.value))}
                className="text-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Membros Inferiores */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Membros Inferiores</h3>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-muted-foreground px-3">
          <div></div>
          <div>Direito</div>
          <div>Esquerdo</div>
        </div>
        <div className="grid gap-3">
          {[
            { label: "Coxa", dirKey: "coxaDireita", esqKey: "coxaEsquerda" },
            { label: "Panturrilha", dirKey: "panturrilhaDireita", esqKey: "panturrilhaEsquerda" },
          ].map(({ label, dirKey, esqKey }) => (
            <div key={label} className="grid grid-cols-3 gap-2 items-center p-3 rounded-lg bg-secondary/50">
              <Label className="text-sm font-medium text-foreground">{label}</Label>
              <Input
                type="number"
                placeholder="cm"
                step="0.1"
                min={0}
                value={data[dirKey as keyof Medidas] || ""}
                onChange={(e) => handleChange(dirKey as keyof Medidas, Number(e.target.value))}
                className="text-center"
              />
              <Input
                type="number"
                placeholder="cm"
                step="0.1"
                min={0}
                value={data[esqKey as keyof Medidas] || ""}
                onChange={(e) => handleChange(esqKey as keyof Medidas, Number(e.target.value))}
                className="text-center"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dobras } from "@/lib/body-assessment-types";

interface SkinfoldFormProps {
  data: Dobras;
  onChange: (data: Dobras) => void;
  errors: Record<string, string>;
}

const dobrasConfig = [
  { key: "peitoral", label: "Peitoral", description: "Diagonal, entre axila e mamilo" },
  { key: "axilarMedia", label: "Axilar Média", description: "Vertical, na linha média axilar" },
  { key: "triceps", label: "Tríceps", description: "Vertical, parte posterior do braço" },
  { key: "subescapular", label: "Subescapular", description: "Diagonal, abaixo da escápula" },
  { key: "abdomen", label: "Abdômen", description: "Vertical, ao lado do umbigo" },
  { key: "supraIliaca", label: "Supra-ilíaca", description: "Diagonal, acima do osso ilíaco" },
  { key: "coxa", label: "Coxa", description: "Vertical, parte anterior da coxa" },
] as const;

export function SkinfoldForm({ data, onChange, errors }: SkinfoldFormProps) {
  const handleChange = (field: keyof Dobras, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const soma = Object.values(data).reduce((acc, val) => acc + (val || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Ruler className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dobras Cutâneas</h2>
          <p className="text-sm text-muted-foreground">Medidas com adipômetro em milímetros (mm)</p>
        </div>
      </div>

      <div className="grid gap-4">
        {dobrasConfig.map(({ key, label, description }) => (
          <div key={key} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
            <div className="flex-1 min-w-0">
              <Label htmlFor={key} className="text-sm font-medium text-foreground">
                {label}
              </Label>
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            </div>
            <div className="w-24">
              <Input
                id={key}
                type="number"
                placeholder="mm"
                step="0.1"
                min={0}
                value={data[key] || ""}
                onChange={(e) => handleChange(key, Number(e.target.value))}
                className={`text-center ${errors[key] ? "border-destructive" : ""}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Soma das Dobras</span>
          <span className="text-2xl font-bold text-primary">{soma.toFixed(1)} mm</span>
        </div>
      </div>
    </div>
  );
}

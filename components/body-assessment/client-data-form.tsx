"use client";

import { User, Scale, Ruler, Calendar, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientData } from "@/lib/body-assessment-types";

interface ClientDataFormProps {
  data: ClientData;
  onChange: (data: ClientData) => void;
  errors: Record<string, string>;
}

export function ClientDataForm({ data, onChange, errors }: ClientDataFormProps) {
  const handleChange = (field: keyof ClientData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dados do Cliente</h2>
          <p className="text-sm text-muted-foreground">Informações básicas para a avaliação</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="nome" className="flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-muted-foreground" />
            Nome Completo
          </Label>
          <Input
            id="nome"
            placeholder="Digite o nome do cliente"
            value={data.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            className={errors.nome ? "border-destructive" : ""}
          />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo</Label>
            <Select
              value={data.sexo}
              onValueChange={(value) => handleChange("sexo", value as "masculino" | "feminino")}
            >
              <SelectTrigger id="sexo" className={errors.sexo ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
            {errors.sexo && <p className="text-sm text-destructive">{errors.sexo}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idade" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Idade
            </Label>
            <Input
              id="idade"
              type="number"
              placeholder="Anos"
              min={1}
              max={120}
              value={data.idade || ""}
              onChange={(e) => handleChange("idade", Number(e.target.value))}
              className={errors.idade ? "border-destructive" : ""}
            />
            {errors.idade && <p className="text-sm text-destructive">{errors.idade}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="peso" className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-muted-foreground" />
              Peso (kg)
            </Label>
            <Input
              id="peso"
              type="number"
              placeholder="kg"
              step="0.1"
              min={1}
              value={data.peso || ""}
              onChange={(e) => handleChange("peso", Number(e.target.value))}
              className={errors.peso ? "border-destructive" : ""}
            />
            {errors.peso && <p className="text-sm text-destructive">{errors.peso}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="altura" className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              Altura (cm)
            </Label>
            <Input
              id="altura"
              type="number"
              placeholder="cm ou m (ex: 175 ou 1.75)"
              min={1}
              value={data.altura || ""}
              onChange={(e) => handleChange("altura", Number(e.target.value))}
              className={errors.altura ? "border-destructive" : ""}
            />
            {errors.altura && <p className="text-sm text-destructive">{errors.altura}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avaliador" className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Nome do Avaliador
          </Label>
          <Input
            id="avaliador"
            placeholder="Digite o nome do avaliador"
            value={data.avaliador}
            onChange={(e) => handleChange("avaliador", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

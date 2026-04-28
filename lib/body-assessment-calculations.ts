import type { ClientData, Dobras, Medidas, Resultados } from "./body-assessment-types";

function normalizarAlturaCm(altura: number): number {
  if (!Number.isFinite(altura) || altura <= 0) return 0;
  // Accept values in meters (e.g. 1.75) or centimeters (e.g. 175)
  return altura <= 3 ? altura * 100 : altura;
}

export function calcularSomaDobras(dobras: Dobras): number {
  return (
    dobras.peitoral +
    dobras.axilarMedia +
    dobras.triceps +
    dobras.subescapular +
    dobras.abdomen +
    dobras.supraIliaca +
    dobras.coxa
  );
}

export function calcularDensidade(somaDobras: number, idade: number, sexo: "masculino" | "feminino"): number {
  if (sexo === "masculino") {
    return 1.112 - (0.00043499 * somaDobras) + (0.00000055 * somaDobras * somaDobras) - (0.00028826 * idade);
  } else {
    return 1.097 - (0.00046971 * somaDobras) + (0.00000056 * somaDobras * somaDobras) - (0.00012828 * idade);
  }
}

export function calcularPercentualGordura(densidade: number): number {
  return ((4.95 / densidade) - 4.50) * 100;
}

export function calcularMassaGorda(peso: number, percentualGordura: number): number {
  return peso * (percentualGordura / 100);
}

export function calcularMassaMagra(peso: number, massaGorda: number): number {
  return peso - massaGorda;
}

export function calcularRCQ(cintura: number, quadril: number): number {
  if (quadril === 0) return 0;
  return cintura / quadril;
}

export function classificarGordura(percentual: number, sexo: "masculino" | "feminino"): string {
  if (sexo === "masculino") {
    if (percentual < 6) return "Muito baixo";
    if (percentual <= 15) return "Ideal";
    if (percentual <= 25) return "Acima do ideal";
    return "Obesidade";
  } else {
    if (percentual < 14) return "Muito baixo";
    if (percentual <= 25) return "Ideal";
    if (percentual <= 32) return "Acima do ideal";
    return "Obesidade";
  }
}

export function classificarRCQ(rcq: number, sexo: "masculino" | "feminino"): string {
  if (rcq === 0) return "-";
  if (sexo === "masculino") {
    if (rcq < 0.90) return "Baixo risco";
    if (rcq <= 0.99) return "Risco moderado";
    return "Alto risco";
  } else {
    if (rcq < 0.80) return "Baixo risco";
    if (rcq <= 0.85) return "Risco moderado";
    return "Alto risco";
  }
}

export function calcularIMC(peso: number, altura: number): number {
  const alturaCm = normalizarAlturaCm(altura);
  if (alturaCm <= 0) return 0;
  const alturaMetros = alturaCm / 100;
  if (alturaMetros <= 0) return 0;
  return peso / (alturaMetros * alturaMetros);
}

export function classificarIMC(imc: number): string {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade I";
  if (imc < 40) return "Obesidade II";
  return "Obesidade III";
}

export function calcularTMB(peso: number, altura: number, idade: number, sexo: "masculino" | "feminino"): number {
  const alturaCm = normalizarAlturaCm(altura);
  if (sexo === "masculino") {
    return 88.362 + (13.397 * peso) + (4.799 * alturaCm) - (5.677 * idade);
  } else {
    return 447.593 + (9.247 * peso) + (3.098 * alturaCm) - (4.330 * idade);
  }
}

export function getMetaPercentual(sexo: "masculino" | "feminino"): { min: number; max: number } {
  return sexo === "masculino" ? { min: 10, max: 15 } : { min: 18, max: 25 };
}

export function calcularPesoAlvo(massaMagra: number, metaPercentual: { min: number; max: number }): number {
  const metaMedia = (metaPercentual.min + metaPercentual.max) / 2;
  return massaMagra / (1 - metaMedia / 100);
}

export function calcularGorduraAPerder(peso: number, pesoAlvo: number): number {
  return Math.max(0, peso - pesoAlvo);
}

export function calcularResultados(
  cliente: ClientData,
  dobras: Dobras,
  medidas: Medidas
): Resultados {
  const somaDobras = calcularSomaDobras(dobras);
  const densidade = calcularDensidade(somaDobras, cliente.idade, cliente.sexo);
  const percentualGordura = calcularPercentualGordura(densidade);
  const massaGorda = calcularMassaGorda(cliente.peso, percentualGordura);
  const massaMagra = calcularMassaMagra(cliente.peso, massaGorda);
  const rcq = calcularRCQ(medidas.cintura, medidas.quadril);
  const classificacaoGordura = classificarGordura(percentualGordura, cliente.sexo);
  const classificacaoRCQ = classificarRCQ(rcq, cliente.sexo);
  const metaPercentual = getMetaPercentual(cliente.sexo);
  const pesoAlvo = calcularPesoAlvo(massaMagra, metaPercentual);
  const gorduraAPerder = calcularGorduraAPerder(cliente.peso, pesoAlvo);
  const imc = calcularIMC(cliente.peso, cliente.altura);
  const classificacaoIMC = classificarIMC(imc);
  const tmb = calcularTMB(cliente.peso, cliente.altura, cliente.idade, cliente.sexo);

  return {
    somaDobras,
    densidade,
    percentualGordura,
    massaGorda,
    massaMagra,
    rcq,
    classificacaoGordura,
    classificacaoRCQ,
    pesoAlvo,
    gorduraAPerder,
    metaPercentual,
    imc,
    classificacaoIMC,
    tmb,
  };
}

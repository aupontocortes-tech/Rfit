export interface ClientData {
  nome: string;
  sexo: "masculino" | "feminino";
  idade: number;
  peso: number;
  altura: number;
  dataAvaliacao: string;
  avaliador: string;
  telefone?: string;
  numeroAvaliacao?: string;
}

export interface Dobras {
  peitoral: number;
  axilarMedia: number;
  triceps: number;
  subescapular: number;
  abdomen: number;
  supraIliaca: number;
  coxa: number;
  biceps?: number;
  panturrilha?: number;
}

export interface Medidas {
  // Tronco
  ombro: number;
  pescoco: number;
  toraxRelaxado: number;
  toraxInspirado: number;
  abdome: number;
  cintura: number;
  quadril: number;
  // Membros - Direito
  antebracoDireito: number;
  bracoRelaxadoDireito: number;
  bracoContraidoDireito: number;
  coxaDireita: number;
  panturrilhaDireita: number;
  // Membros - Esquerdo
  antebracoEsquerdo: number;
  bracoRelaxadoEsquerdo: number;
  bracoContraidoEsquerdo: number;
  coxaEsquerda: number;
  panturrilhaEsquerda: number;
}

export interface Resultados {
  somaDobras: number;
  densidade: number;
  percentualGordura: number;
  massaGorda: number;
  massaMagra: number;
  rcq: number;
  classificacaoGordura: string;
  classificacaoRCQ: string;
  pesoAlvo: number;
  gorduraAPerder: number;
  metaPercentual: { min: number; max: number };
  imc: number;
  classificacaoIMC: string;
  tmb: number;
}

export interface AssessmentData {
  cliente: ClientData;
  dobras: Dobras;
  medidas: Medidas;
  resultados?: Resultados;
}

/** Linha da listagem em /avaliacoes (API GET /api/avaliacoes) */
export interface AvaliacaoResumo {
  id: number;
  nome: string;
  data_avaliacao: string;
  created_at: string;
}

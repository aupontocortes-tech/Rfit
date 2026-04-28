import type { AssessmentData, AvaliacaoResumo } from "./body-assessment-types";

const STORAGE_KEY = "rfit-avaliacoes-v2";

export interface AvaliacaoStoredRow {
  /** ID usado na lista / detalhe neste aparelho */
  id: number;
  /** ID retornado pelo SQLite no servidor, se houver */
  serverId?: number;
  created_at: string;
  data: AssessmentData;
}

function readAll(): AvaliacaoStoredRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AvaliacaoStoredRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: AvaliacaoStoredRow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function nextId(rows: AvaliacaoStoredRow[]): number {
  if (rows.length === 0) return 1;
  return Math.max(...rows.map((r) => r.id)) + 1;
}

/** Lista resumos ordenados do mais recente ao mais antigo */
export function listResumosLocal(): AvaliacaoResumo[] {
  const rows = readAll();
  const sorted = [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted.map((r) => ({
    id: r.id,
    nome: r.data.cliente.nome,
    data_avaliacao: r.data.cliente.dataAvaliacao,
    created_at: new Date(r.created_at).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }),
  }));
}

export function getAvaliacaoLocal(id: number): AssessmentData | null {
  const row = readAll().find((r) => r.id === id);
  return row?.data ?? null;
}

/** Grava no aparelho e devolve o id local usado na lista */
export function saveAvaliacaoLocal(data: AssessmentData): number {
  const rows = readAll();
  const id = nextId(rows);
  rows.push({
    id,
    created_at: new Date().toISOString(),
    data,
  });
  writeAll(rows);
  return id;
}

export function setServerIdForLocalRow(localId: number, serverId: number) {
  const rows = readAll();
  const row = rows.find((r) => r.id === localId);
  if (row) {
    row.serverId = serverId;
    writeAll(rows);
  }
}

/** Traz avaliações que existem só no SQLite (ex.: outro deploy / servidor) para o armazenamento local */
export async function syncFromServer(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/avaliacoes");
    if (!res.ok) return;
    const summaries = (await res.json()) as AvaliacaoResumo[];
    if (!Array.isArray(summaries) || summaries.length === 0) return;

    let rows = readAll();
    const knownServer = new Set(
      rows.filter((r) => r.serverId != null).map((r) => r.serverId as number)
    );
    let changed = false;

    for (const s of summaries) {
      if (knownServer.has(s.id)) continue;
      const dr = await fetch(`/api/avaliacoes/${s.id}`);
      if (!dr.ok) continue;
      const data = (await dr.json()) as AssessmentData;
      const localId = nextId(rows);
      rows.push({
        id: localId,
        serverId: s.id,
        created_at: s.created_at.includes("T") ? s.created_at : new Date().toISOString(),
        data,
      });
      knownServer.add(s.id);
      changed = true;
    }

    if (changed) writeAll(rows);
  } catch {
    /* rede / API indisponível */
  }
}

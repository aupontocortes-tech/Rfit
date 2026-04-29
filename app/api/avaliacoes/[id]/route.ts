import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { AssessmentData } from "@/lib/body-assessment-types";

export const runtime = "nodejs";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const database = getDb();
  const row = database.prepare(`SELECT payload FROM avaliacoes WHERE id = ?`).get(id) as
    | { payload: string }
    | undefined;

  if (!row) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  try {
    const data = JSON.parse(row.payload) as AssessmentData;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Dados corrompidos" }, { status: 500 });
  }
}

function parseAssessmentData(body: unknown): AssessmentData | null {
  try {
    const data = body as AssessmentData;
    if (!data?.cliente?.nome?.trim()) return null;
    if (!data.resultados) return null;
    return data;
  } catch {
    return null;
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const database = getDb();
  const info = database.prepare(`DELETE FROM avaliacoes WHERE id = ?`).run(id);
  if (info.changes === 0) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data = parseAssessmentData(body);
  if (!data) {
    return NextResponse.json(
      { error: "Nome é obrigatório e salve apenas após calcular a avaliação" },
      { status: 400 }
    );
  }

  const database = getDb();
  const payload = JSON.stringify(data);
  const info = database
    .prepare(
      `UPDATE avaliacoes
       SET nome = ?, data_avaliacao = ?, payload = ?, created_at = datetime('now')
       WHERE id = ?`
    )
    .run(data.cliente.nome.trim(), data.cliente.dataAvaliacao, payload, id);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

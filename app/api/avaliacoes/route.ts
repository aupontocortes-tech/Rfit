import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { AssessmentData } from "@/lib/body-assessment-types";

export const runtime = "nodejs";

export async function GET() {
  const database = getDb();
  const rows = database
    .prepare(
      `SELECT id, nome, data_avaliacao, created_at
       FROM avaliacoes
       ORDER BY datetime(created_at) DESC`
    )
    .all() as { id: number; nome: string; data_avaliacao: string; created_at: string }[];
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  let body: AssessmentData;
  try {
    body = (await req.json()) as AssessmentData;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body?.cliente?.nome?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }
  if (!body.resultados) {
    return NextResponse.json({ error: "Salve apenas após calcular a avaliação" }, { status: 400 });
  }

  const database = getDb();
  const payload = JSON.stringify(body);
  const info = database
    .prepare(
      `INSERT INTO avaliacoes (nome, data_avaliacao, payload)
       VALUES (?, ?, ?)`
    )
    .run(body.cliente.nome.trim(), body.cliente.dataAvaliacao, payload);

  const id = typeof info.lastInsertRowid === "bigint" ? Number(info.lastInsertRowid) : info.lastInsertRowid;
  return NextResponse.json({ id });
}

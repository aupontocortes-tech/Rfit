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

import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";

const isVercel = process.env.VERCEL === "1";
/** Em Vercel o projeto é somente leitura exceto /tmp; em PC/VPS usamos ./data */
const dbDir = process.env.RFIT_SQLITE_DIR
  ? process.env.RFIT_SQLITE_DIR
  : isVercel
    ? path.join(os.tmpdir(), "rfit-data")
    : path.join(process.cwd(), "data");
const dbPath = process.env.RFIT_SQLITE_PATH ?? path.join(dbDir, "rfit.sqlite");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(dbDir, { recursive: true });
  const instance = new Database(dbPath);
  // WAL cria -wal/-shm; em /tmp e alguns hosts serverless DELETE é mais previsível
  instance.pragma(isVercel ? "journal_mode = DELETE" : "journal_mode = WAL");
  instance.exec(`
    CREATE TABLE IF NOT EXISTS avaliacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      data_avaliacao TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_avaliacoes_nome ON avaliacoes(nome);
    CREATE INDEX IF NOT EXISTS idx_avaliacoes_created ON avaliacoes(created_at DESC);
  `);
  db = instance;
  return db;
}

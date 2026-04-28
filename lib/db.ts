import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const dbDir = path.join(process.cwd(), "data");
const dbPath = path.join(dbDir, "rfit.sqlite");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(dbDir, { recursive: true });
  const instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
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

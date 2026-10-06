import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

// Carpeta server/migrations (funciona tanto desde src/ como desde dist/)
const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations', import.meta.url));

const dbFile = resolve(env.dbPath);
mkdirSync(dirname(dbFile), { recursive: true });

export const db = new DatabaseSync(dbFile);
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Aplica en orden los archivos .sql de /migrations que aún no se han ejecutado.
 * Para cambiar la base de datos, crea un archivo nuevo (ej. 002_auditorias.sql);
 * nunca modifiques una migración ya aplicada.
 */
export function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migraciones (
      nombre     TEXT PRIMARY KEY,
      aplicada_en TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    db.prepare('SELECT nombre FROM _migraciones').all().map((row) => String(row.nombre)),
  );

  const pending = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql') && !applied.has(file))
    .sort();

  for (const file of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migraciones (nombre) VALUES (?)').run(file);
      db.exec('COMMIT');
      console.log(`[db] Migración aplicada: ${file}`);
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`Error aplicando la migración ${file}: ${(error as Error).message}`);
    }
  }
}

/** Ejecuta fn dentro de una transacción: si algo falla, no se guarda ningún cambio. */
export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function isDatabaseConnected(): boolean {
  try {
    db.prepare('SELECT 1').get();
    return true;
  } catch {
    return false;
  }
}

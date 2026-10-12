/**
 * Conexión a la base de datos (libSQL, compatible con SQLite).
 * - Con TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN): base de datos en la nube (Turso). Los datos no se
 *   pierden aunque el hosting se reinicie. Es lo que usa la web publicada.
 * - Sin ella: archivo local DB_PATH (por defecto server/data/sig.db), para desarrollo en el PC.
 * Todas las consultas son asíncronas porque la base puede estar en otro servidor.
 */
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient, type InStatement, type InValue, type ResultSet, type Row } from '@libsql/client';
import { env } from '../config/env.js';

export type Fila = Row;
export type Valor = InValue;

/** Lo que pueden usar los servicios: la conexión normal o una transacción en curso */
export interface Ejecutor {
  execute(stmt: InStatement): Promise<ResultSet>;
  batch(stmts: InStatement[]): Promise<ResultSet[]>;
}

// Carpeta server/migrations (funciona tanto desde src/ como desde dist/)
const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations', import.meta.url));

// Solo con URL y token: si falta el token, la app sigue funcionando con la base local en vez de caerse
export const baseRemota = Boolean(env.tursoUrl && env.tursoToken);
if (env.tursoUrl && !env.tursoToken) console.warn('[db] Falta TURSO_AUTH_TOKEN: se usa la base de datos local.');
if (!baseRemota) mkdirSync(dirname(resolve(env.dbPath)), { recursive: true });

export const db = createClient(
  baseRemota
    ? { url: env.tursoUrl, authToken: env.tursoToken }
    : { url: `file:${env.dbPath.replace(/\\/g, '/')}` },
);

/** Ejecuta una consulta y devuelve sus filas */
export async function consultar(sql: string, args: Valor[] = [], ej: Ejecutor = db): Promise<Fila[]> {
  return (await ej.execute({ sql, args })).rows;
}

/** Primera fila de la consulta, o null */
export async function consultarUna(sql: string, args: Valor[] = [], ej: Ejecutor = db): Promise<Fila | null> {
  return (await consultar(sql, args, ej))[0] ?? null;
}

/** Ejecuta INSERT/UPDATE/DELETE y devuelve filas afectadas e id insertado */
export async function ejecutar(sql: string, args: Valor[] = [], ej: Ejecutor = db) {
  const r = await ej.execute({ sql, args });
  return { cambios: r.rowsAffected, id: r.lastInsertRowid === undefined ? 0 : Number(r.lastInsertRowid) };
}

/** Varias sentencias en un solo envío; o se aplican todas, o ninguna. Devuelve las filas afectadas de cada una. */
export async function lote(sentencias: InStatement[], ej: Ejecutor = db): Promise<number[]> {
  if (!sentencias.length) return [];
  return (await ej.batch(sentencias)).map((r) => r.rowsAffected);
}

/** Ejecuta fn dentro de una transacción: si algo falla, no se guarda ningún cambio. */
export async function transaction<T>(fn: (tx: Ejecutor) => Promise<T>): Promise<T> {
  const tx = await db.transaction('write');
  try {
    const resultado = await fn(tx);
    await tx.commit();
    return resultado;
  } catch (error) {
    await tx.rollback().catch(() => undefined);
    throw error;
  } finally {
    tx.close();
  }
}

/** Separa un archivo .sql en sentencias (respeta textos entre comillas y comentarios --) */
function sentenciasDe(sql: string): string[] {
  const resultado: string[] = [];
  let actual = '';
  let comillas = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (!comillas && c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      actual += '\n';
      continue;
    }
    if (c === "'") comillas = !comillas;
    if (c === ';' && !comillas) {
      if (actual.trim()) resultado.push(actual.trim());
      actual = '';
    } else {
      actual += c;
    }
  }
  if (actual.trim()) resultado.push(actual.trim());
  return resultado;
}

/**
 * Aplica en orden los archivos .sql de /migrations que aún no se han ejecutado.
 * Para cambiar la base de datos, crea un archivo nuevo (ej. 006_auditorias.sql);
 * nunca modifiques una migración ya aplicada.
 */
export async function runMigrations(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migraciones (
      nombre     TEXT PRIMARY KEY,
      aplicada_en TEXT NOT NULL DEFAULT (datetime('now'))
    )`);

  const aplicadas = new Set((await consultar('SELECT nombre FROM _migraciones')).map((f) => String(f.nombre)));
  const pendientes = readdirSync(MIGRATIONS_DIR)
    .filter((archivo) => archivo.endsWith('.sql') && !aplicadas.has(archivo))
    .sort();

  for (const archivo of pendientes) {
    const sentencias = sentenciasDe(readFileSync(join(MIGRATIONS_DIR, archivo), 'utf8'));
    try {
      await db.batch([...sentencias, { sql: 'INSERT INTO _migraciones (nombre) VALUES (?)', args: [archivo] }], 'write');
      console.log(`[db] Migración aplicada: ${archivo}`);
    } catch (error) {
      throw new Error(`Error aplicando la migración ${archivo}: ${(error as Error).message}`);
    }
  }
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await db.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

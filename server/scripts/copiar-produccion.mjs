/**
 * Copia los datos de la plataforma publicada (Turso) a la base local del borrador (server/data/sig.db),
 * para que el borrador muestre lo mismo que la web. Solo LEE de producción; lo que se reemplaza es la base local,
 * de la que antes se guarda un respaldo (server/data/respaldos/).
 *
 * Uso (desde la carpeta server):  node scripts/copiar-produccion.mjs
 * Necesita PRODUCCION_TURSO_URL y PRODUCCION_TURSO_TOKEN en server/.env (no se suben al repositorio).
 */
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

const SERVER = fileURLToPath(new URL('..', import.meta.url));
const ENV = `${SERVER}.env`;
if (existsSync(ENV)) process.loadEnvFile(ENV);
const { PRODUCCION_TURSO_URL: url, PRODUCCION_TURSO_TOKEN: authToken } = process.env;
if (!url || !authToken) {
  console.error('Faltan PRODUCCION_TURSO_URL y PRODUCCION_TURSO_TOKEN en server/.env');
  process.exit(1);
}
const LOCAL = `${SERVER}data/sig.db`.replace(/\\/g, '/');
if (!existsSync(LOCAL)) {
  console.error('No existe la base local (abra una vez el borrador para que se cree): ' + LOCAL);
  process.exit(1);
}

const remota = createClient({ url, authToken });
const local = createClient({ url: `file:${LOCAL}` });
const q = (nombre) => `"${nombre.replace(/"/g, '""')}"`;
const tablasDe = async (c) =>
  (await c.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%' ORDER BY name")).rows.map((r) => String(r.name));
const columnasDe = async (c, t) => (await c.execute(`PRAGMA table_info(${q(t)})`)).rows.map((r) => String(r.name));

// 1. Respaldo de la base local (copia consistente aunque el borrador esté abierto); se conservan los 3 últimos
const RESPALDOS = `${SERVER}data/respaldos`.replace(/\\/g, '/');
mkdirSync(RESPALDOS, { recursive: true });
const sello = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
await local.execute(`VACUUM INTO '${RESPALDOS}/sig-${sello}.db'`);
for (const viejo of readdirSync(RESPALDOS).filter((f) => /^sig-\d{14}\.db$/.test(f)).sort().slice(0, -3)) rmSync(`${RESPALDOS}/${viejo}`);
console.log(`Respaldo de la base local: data/respaldos/sig-${sello}.db`);

// 2. Tablas: las de producción que también existen en el borrador (las migraciones crean las mismas en los dos)
const [enRemota, enLocal] = await Promise.all([tablasDe(remota), tablasDe(local)]);
const tablas = enRemota.filter((t) => enLocal.includes(t));
const soloRemota = enRemota.filter((t) => !enLocal.includes(t));
if (soloRemota.length) console.warn(`Tablas de producción que el borrador aún no tiene (abra el borrador para aplicar las migraciones): ${soloRemota.join(', ')}`);

// 3. Lectura de producción (por páginas, para no traer de golpe los archivos guardados)
const datos = [];
for (const t of tablas) {
  const [colsR, colsL] = await Promise.all([columnasDe(remota, t), columnasDe(local, t)]);
  const cols = colsR.filter((c) => colsL.includes(c));
  const filas = [];
  for (let desde = 0; ; desde += 200) {
    const r = await remota.execute(`SELECT ${cols.map(q).join(', ')} FROM ${q(t)} ORDER BY rowid LIMIT 200 OFFSET ${desde}`);
    filas.push(...r.rows);
    if (r.rows.length < 200) break;
  }
  datos.push({ t, cols, filas });
}

// 4. Reemplazo en la base local: todo o nada
const tx = await local.transaction('write');
try {
  await tx.execute('PRAGMA defer_foreign_keys = ON');
  for (const { t } of datos) await tx.execute(`DELETE FROM ${q(t)}`);
  for (const { t, cols, filas } of datos) {
    const sql = `INSERT INTO ${q(t)} (${cols.map(q).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
    for (let i = 0; i < filas.length; i += 100) await tx.batch(filas.slice(i, i + 100).map((f) => ({ sql, args: cols.map((c) => f[c]) })));
  }
  await tx.commit();
} catch (e) {
  await tx.rollback();
  console.error('No se copió nada (la base local quedó como estaba):', e.message);
  process.exit(1);
}
console.log(`Copiadas ${datos.length} tablas de producción al borrador:`);
for (const { t, filas } of datos) if (filas.length) console.log(`  ${t}: ${filas.length}`);

// Espacio que ocupa la base de datos: total frente al límite del plan, por módulo y los archivos guardados dentro.
import { env } from '../../config/env.js';
import { baseRemota, consultar } from '../../db/database.js';

export interface EspacioModulo {
  modulo: string;
  bytes: number;
}

export interface ArchivosGuardados {
  tipo: string;
  modulo: string;
  cantidad: number;
  bytes: number;
}

export interface Almacenamiento {
  /** 'turso' (la web publicada) o 'local' (el borrador en el PC) */
  base: 'turso' | 'local';
  usado: number;
  limite: number;
  modulos: EspacioModulo[];
  archivos: ArchivosGuardados[];
}

/** Módulo de cada tabla, por su prefijo (lo que no coincide es del sistema: sesiones, migraciones, configuración) */
const MODULOS: [prefijo: string, modulo: string][] = [
  ['monitoreo_', 'Monitoreo de agua'],
  ['lab_', 'Laboratorios de análisis'],
  ['oxigenometro_', 'Laboratorios de análisis'],
  ['checklist_bp_', 'Inspecciones SCI'],
  ['presupuesto_', 'Presupuesto'],
  ['evento', 'Calendario'],
];
const moduloDe = (tabla: string) => MODULOS.find(([p]) => tabla.startsWith(p))?.[1] ?? 'Sistema';

/** Tablas que guardan archivos (columna datos BLOB) */
const ARCHIVOS: { tabla: string; tipo: string }[] = [
  { tabla: 'monitoreo_resultado_pdf', tipo: 'PDF de laboratorio' },
  { tabla: 'monitoreo_logo', tipo: 'Logos de los informes' },
  { tabla: 'checklist_bp_foto', tipo: 'Fotos del check list' },
];

/** Bytes por tabla (los índices cuentan para su tabla). dbstat da el espacio real de las páginas. */
async function bytesPorTabla(): Promise<Map<string, number>> {
  const filas = await consultar(
    `SELECT COALESCE(m.tbl_name, s.name) AS tabla, SUM(s.pgsize) AS bytes
       FROM dbstat s LEFT JOIN sqlite_master m ON m.name = s.name
      GROUP BY COALESCE(m.tbl_name, s.name)`,
  );
  return new Map(filas.map((f) => [String(f.tabla), Number(f.bytes)]));
}

export async function obtenerAlmacenamiento(): Promise<Almacenamiento> {
  const [total] = await consultar('SELECT page_count * page_size AS bytes FROM pragma_page_count(), pragma_page_size()');
  const porTabla = await bytesPorTabla();

  const modulos = new Map<string, number>();
  for (const [tabla, bytes] of porTabla) modulos.set(moduloDe(tabla), (modulos.get(moduloDe(tabla)) ?? 0) + bytes);

  const archivos: ArchivosGuardados[] = [];
  for (const a of ARCHIVOS) {
    const [f] = await consultar(`SELECT COUNT(*) AS cantidad, COALESCE(SUM(LENGTH(datos)), 0) AS bytes FROM ${a.tabla}`);
    archivos.push({ tipo: a.tipo, modulo: moduloDe(a.tabla), cantidad: Number(f.cantidad), bytes: Number(f.bytes) });
  }

  return {
    base: baseRemota ? 'turso' : 'local',
    usado: Number(total.bytes),
    limite: env.limiteBaseMb * 1024 * 1024,
    modulos: [...modulos].map(([modulo, bytes]) => ({ modulo, bytes })).sort((a, b) => b.bytes - a.bytes),
    archivos,
  };
}

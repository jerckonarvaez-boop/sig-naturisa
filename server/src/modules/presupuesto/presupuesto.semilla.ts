/**
 * Datos iniciales del presupuesto. El plan gratuito de Render borra la base de datos cada vez que el
 * servicio se duerme o se publica; por eso, al arrancar con el presupuesto vacío, se carga el último
 * Excel importado en el PC desde server/semillas/presupuesto.sig (cifrado: el repositorio es público).
 * Para actualizarlo: importar el Excel en la versión local y ejecutar `npm run semilla -w server`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from '../../config/env.js';
import { db } from '../../db/database.js';
import { cifrar, descifrar } from '../../utils/cifrado.js';
import { importarPresupuesto, obtenerPresupuesto } from './presupuesto.service.js';
import type { ImportarPresupuestoBody } from './presupuesto.types.js';
import { validarImportacion } from './presupuesto.validator.js';

// server/semillas (funciona tanto desde src/ como desde dist/)
export const ARCHIVO_SEMILLA = fileURLToPath(new URL('../../../semillas/presupuesto.sig', import.meta.url));

interface Semilla {
  /** Fecha de la importación original (se conserva para no aparentar datos más recientes) */
  importadoEn: string;
  datos: ImportarPresupuestoBody;
}

/** Carga la semilla si el presupuesto está vacío. Nunca reemplaza datos existentes ni detiene el servidor. */
export function cargarSemillaPresupuesto() {
  if (!env.semillaClave || !existsSync(ARCHIVO_SEMILLA)) return;
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM presupuesto_gasto').get() as { n: number };
  if (n > 0) return;
  try {
    const semilla = JSON.parse(descifrar(readFileSync(ARCHIVO_SEMILLA), env.semillaClave)) as Semilla;
    const error = validarImportacion(semilla.datos);
    if (error) throw new Error(error);
    importarPresupuesto(semilla.datos, semilla.importadoEn);
    console.log(`[semilla] Presupuesto cargado: ${semilla.datos.gastos.length} registros de «${semilla.datos.archivo}».`);
  } catch (e) {
    console.error('[semilla] No se pudo cargar el presupuesto inicial:', (e as Error).message);
  }
}

/** Genera la semilla cifrada con los datos actuales del presupuesto */
export function generarSemillaPresupuesto(clave: string): { contenido: Buffer; registros: number; archivo: string } {
  const { importacion, gastos, presupuestoArea, presupuestoSubarea } = obtenerPresupuesto();
  if (!importacion || !gastos.length) throw new Error('No hay datos de presupuesto: importe el Excel primero.');
  const semilla: Semilla = {
    importadoEn: importacion.importadoEn,
    datos: { archivo: importacion.archivo, gastos, presupuestoArea, presupuestoSubarea },
  };
  return { contenido: cifrar(JSON.stringify(semilla), clave), registros: gastos.length, archivo: importacion.archivo };
}

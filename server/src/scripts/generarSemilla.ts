/**
 * Genera server/semillas/presupuesto.sig con el presupuesto de la base de datos local (cifrado).
 * Uso: `npm run semilla -w server`. La clave se toma de SEMILLA_CLAVE (server/.env); si no existe,
 * se crea una nueva y se guarda en server/.env. La misma clave debe estar en Render.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { nuevaClave } from '../utils/cifrado.js';
import { ARCHIVO_SEMILLA, generarSemillaPresupuesto } from '../modules/presupuesto/presupuesto.semilla.js';

let clave = process.env.SEMILLA_CLAVE ?? '';
if (!clave) {
  clave = nuevaClave();
  const salto = existsSync('.env') && !readFileSync('.env', 'utf8').endsWith('\n') ? '\n' : '';
  appendFileSync('.env', `${salto}# Clave de los datos iniciales cifrados (server/semillas). Debe ser la misma en Render.\nSEMILLA_CLAVE=${clave}\n`);
  console.log('Se creó una clave nueva en server/.env (SEMILLA_CLAVE).');
}

const { contenido, registros, archivo } = generarSemillaPresupuesto(clave);
mkdirSync(dirname(ARCHIVO_SEMILLA), { recursive: true });
writeFileSync(ARCHIVO_SEMILLA, contenido);
console.log(`Semilla generada: ${registros} registros de «${archivo}» → semillas/presupuesto.sig (${contenido.length} bytes, cifrada).`);

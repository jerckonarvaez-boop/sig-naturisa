// Reglas de monitoreo de agua: evaluación contra el límite permisible, textos de fechas y parámetros por defecto.
import { deISO } from '@/utils/fechas';
import type { PuntoMonitoreo } from '../meta';
import type { DefinicionMonitoreo, ParametroMonitoreo, Resultado, Sitio, ValorParametro } from '../types';

export type Evaluacion = 'cumple' | 'no-cumple' | null;

/** Número de un resultado del laboratorio: "11,04" → 11.04 · "<0,27" → 0.27 · "Ausencia" → null */
export function numeroDe(valor: string): number | null {
  const m = /^\s*[<>≤≥]?\s*(-?\d+(?:[.,]\d+)?)\s*$/.exec(valor);
  return m ? Number(m[1].replace(',', '.')) : null;
}

/** ¿El valor cumple el límite máximo permisible? null si no hay límite o no se puede evaluar */
export function evaluar(parametro: ParametroMonitoreo | undefined, valor: string): Evaluacion {
  if (!parametro || !valor.trim()) return null;
  if (parametro.textoCumple) {
    return valor.trim().toLowerCase() === parametro.textoCumple ? 'cumple' : numeroDe(valor) === null ? 'no-cumple' : null;
  }
  const n = numeroDe(valor);
  if (n === null || (parametro.max === undefined && parametro.min === undefined)) return null;
  if (parametro.min !== undefined && n < parametro.min) return 'no-cumple';
  if (parametro.max !== undefined && (parametro.maxExclusivo ? n >= parametro.max : n > parametro.max)) return 'no-cumple';
  return 'cumple';
}

/** Parámetros del resultado que superan el límite (solo el efluente se compara con la norma de descarga) */
export function incumplimientos(resultado: Pick<Resultado, 'punto' | 'valores'>, def: DefinicionMonitoreo): ValorParametro[] {
  if (resultado.punto !== 'efluente') return [];
  return resultado.valores.filter((v) => evaluar(parametroDe(def, v.clave), v.valor) === 'no-cumple');
}

export const parametroDe = (def: DefinicionMonitoreo, clave: string) => def.parametros.find((p) => p.clave === clave);

/** Parámetros con los que abre un resultado nuevo: afluente (ASC) o efluente según el tipo de las instalaciones */
export function parametrosIniciales(def: DefinicionMonitoreo, punto: PuntoMonitoreo, sitios: Sitio[]): string[] {
  if (punto === 'afluente') return def.predeterminados.afluente;
  return sitios.some((s) => s.tipo === 'larvas') ? def.predeterminados.larvas : def.predeterminados.camaronera;
}

/* ---------- textos de fechas del informe ---------- */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['Ene', 'Feb', 'Marz', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** "Marz10-2026" (como en el nombre de los informes) */
export function fechaInforme(iso: string): string {
  const d = deISO(iso);
  return `${MESES_CORTOS[d.getMonth()]}${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
}

/** "marzo 2026" */
export const mesAnio = (iso: string) => `${MESES[deISO(iso).getMonth()]} ${deISO(iso).getFullYear()}`;

/** 1 (enero a junio) o 2 (julio a diciembre) */
export const semestre = (iso: string) => (deISO(iso).getMonth() < 6 ? 1 : 2);

/** "Primer Semestre del año 2026 (marzo 2026)" */
export const textoSemestre = (iso: string) =>
  `${semestre(iso) === 1 ? 'Primer' : 'Segundo'} Semestre del año ${deISO(iso).getFullYear()} (${mesAnio(iso)})`;

/** "15 de octubre del 2025" */
export function fechaLarga(iso: string): string {
  const d = deISO(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} del ${d.getFullYear()}`;
}

/** Nombre de archivo sugerido: "1-PGC-025-Inf Monit-Naturisa S.A. – Isla Josefina-Marz10-2026" */
export const nombreArchivoInforme = (sitio: Sitio, resultado: Resultado) =>
  `${sitio.numero}-PGC-025-Inf Monit-${sitio.nombre}-${fechaInforme(resultado.fechaMuestreo)}`;

/** Años con resultados, del más reciente al más antiguo */
export const aniosDe = (resultados: Resultado[]) =>
  [...new Set(resultados.map((r) => Number(r.fechaMuestreo.slice(0, 4))))].sort((a, b) => b - a);

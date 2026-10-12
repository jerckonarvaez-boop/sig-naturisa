// Reglas de los informes de laboratorio (funciones puras, sin React).
import { miles } from '@/utils/numeros';
import type { CampoLab, SeccionLab } from '../types';

/** Ruta de la página de cada sección (la URL usa "patologias" en plural) */
export const RUTA_SECCION: Record<SeccionLab['id'], string> = {
  agua: '/laboratorios/agua',
  suelo: '/laboratorios/suelo',
  patologia: '/laboratorios/patologias',
};

export const camposDelTipo = (seccion: SeccionLab, tipo: string) =>
  seccion.campos.filter((c) => !c.soloTipos || c.soloTipos.includes(tipo));

export const gruposDelTipo = (seccion: SeccionLab, tipo: string) =>
  seccion.grupos.filter((g) => !g.soloTipos || g.soloTipos.includes(tipo));

export const nombreTipo = (seccion: SeccionLab, tipo: string) => seccion.tipos.find((t) => t.id === tipo)?.nombre ?? tipo;

/** Siguiente código de la sección en el año: AA-2026-008 → AA-2026-009 (toma el mayor número usado) */
export function siguienteCodigo(prefijo: string, codigos: string[], anio = new Date().getFullYear()): string {
  const patron = new RegExp(`^${prefijo}-${anio}-(\\d+)`, 'i');
  const mayor = codigos.reduce((m, c) => {
    const numeros = (c.match(patron) ? c.slice(`${prefijo}-${anio}-`.length).match(/\d+/g) : null) ?? [];
    return Math.max(m, ...numeros.map(Number));
  }, 0);
  return `${prefijo}-${anio}-${String(mayor + 1).padStart(3, '0')}`;
}

/** Texto editado → número (acepta coma decimal); null si está vacío o no es número */
export const aNumero = (texto: string): number | null => {
  const t = texto.trim().replace(',', '.');
  if (!t || t === '-') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

// ---------- patología: grado 0 – 4 ----------
export type NivelPatologia = 'ausencia' | 'bajo' | 'medio' | 'alto' | 'muy-alto';

export function nivelPatologia(grado: number): NivelPatologia {
  if (grado <= 0) return 'ausencia';
  if (grado < 1) return 'bajo';
  if (grado < 2) return 'medio';
  if (grado < 3) return 'alto';
  return 'muy-alto';
}

/** Siempre texto + color (nunca solo color) */
export const NIVELES_PATOLOGIA: Record<NivelPatologia, { label: string; clase: string }> = {
  ausencia: { label: 'Ausencia', clase: 'text-slate-500 dark:text-slate-400' },
  bajo: { label: 'Bajo', clase: 'text-emerald-700 dark:text-emerald-300' },
  medio: { label: 'Medio', clase: 'text-amber-700 dark:text-amber-300' },
  alto: { label: 'Alto', clase: 'text-orange-700 dark:text-orange-300' },
  'muy-alto': { label: 'Muy alto', clase: 'text-red-700 dark:text-red-300' },
};

// ---------- referencias ----------
/** Texto de referencia de un parámetro, ej. "Ref. 7 – 8" o "Ref. = 11,6 × salinidad" */
export function textoReferencia(campo: CampoLab): string {
  if (campo.escala) return '';
  if (campo.factorSalinidad) return `Ref. = ${String(campo.factorSalinidad).replace('.', ',')} × salinidad`;
  if (campo.min != null && campo.max != null) return `Ref. ${fmt(campo.min)} – ${fmt(campo.max)}`;
  return '';
}

const fmt = (n: number) => String(n).replace('.', ',');

/** Comparación con la referencia: bajo, alto, o el valor de referencia calculado con la salinidad */
export function evaluarReferencia(campo: CampoLab, valor: number | null, salinidad: number | null) {
  if (valor == null) return null;
  if (campo.escala === 'patologia') return { tipo: 'nivel' as const, nivel: nivelPatologia(valor) };
  if (campo.factorSalinidad && salinidad) {
    return { tipo: 'referencia' as const, texto: `ref. ${miles(campo.factorSalinidad * salinidad)}` };
  }
  if (campo.min != null && valor < campo.min) return { tipo: 'fuera' as const, texto: '▼ bajo' };
  if (campo.max != null && valor > campo.max) return { tipo: 'fuera' as const, texto: '▲ alto' };
  return null;
}

/** Total de fitoplancton (suma de los grupos) de una muestra de agua */
export const CLAVES_FITOPLANCTON = ['diatomeas', 'cianofitas', 'clorofitas', 'dinoflagelados', 'otros_fito'];

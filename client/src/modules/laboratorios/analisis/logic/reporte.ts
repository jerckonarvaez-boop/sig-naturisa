// Formatos del informe oficial impreso (números con coma decimal, notación científica, fechas cortas).
import type { InformeForm } from '../hooks/useInformeForm';
import type { SeccionLab, ValorLab } from '../types';
import { aNumero, camposDelTipo } from './laboratorio';

/** Informe listo para el formato oficial: valores numéricos ya convertidos */
export interface InformeVista extends Omit<InformeForm, 'muestras'> {
  muestras: { nombre: string; valores: Record<string, ValorLab> }[];
}

export function aVista(seccion: SeccionLab, form: InformeForm): InformeVista {
  const campos = camposDelTipo(seccion, form.tipo);
  return {
    ...form,
    muestras: form.muestras.map((m) => ({
      nombre: m.nombre,
      valores: Object.fromEntries(
        campos.map((c) => [c.clave, c.tipo === 'numero' ? aNumero(m.valores[c.clave] ?? '') : (m.valores[c.clave] ?? '').trim() || null]),
      ),
    })),
  };
}

export const num = (v: ValorLab | undefined): number | null => (typeof v === 'number' ? v : null);
export const txt = (v: ValorLab | undefined): string => (typeof v === 'string' ? v : '');

/** 8.5 → "8,50" con decimales fijos; sin decimales indicados conserva los del valor. null → "-" */
export function fmt(v: number | null, decimales?: number): string {
  if (v == null) return '-';
  const t = decimales != null ? v.toFixed(decimales) : String(Math.round(v * 1000) / 1000);
  return t.replace('.', ',');
}

/** 930000 → "9,3E+05" (como Excel); 0 → "0" */
export function cientifico(v: number | null, decimales = 1): string {
  if (v == null) return '-';
  if (v === 0) return '0';
  const [m, e] = v.toExponential(decimales).split('e');
  const exp = Number(e);
  return `${m.replace('.', ',')}E${exp < 0 ? '-' : '+'}${String(Math.abs(exp)).padStart(2, '0')}`;
}

/** 0.2229 (ya en %) → "2,2%" */
export const porcentaje = (v: number | null, decimales = 1) => (v == null ? '-' : `${v.toFixed(decimales).replace('.', ',')}%`);

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** AAAA-MM-DD → "7-ene-26" (agua y suelo) o "9-feb.-2026" (patología) */
export function fechaInforme(iso: string, estilo: 'corta' | 'larga' = 'corta'): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const mes = MESES_CORTOS[m - 1];
  return estilo === 'corta' ? `${d}-${mes}-${String(y).slice(2)}` : `${d}-${mes}.-${y}`;
}

/** Grado de patología: 1 decimal con coma; el 0 se muestra "0" */
export const grado = (v: number | null) => (v == null ? '' : v === 0 ? '0' : v.toFixed(1).replace('.', ','));

/** Estilo del grado en el informe: negrita desde 1,0; naranja desde 2,0; rojo desde 3,0 */
export const claseGrado = (v: number | null) =>
  v == null || v < 1 ? '' : v >= 3 ? 'rep-grado-muy-alto' : v >= 2 ? 'rep-grado-alto' : 'rep-grado-medio';

/** Patología con muchas muestras: el informe sale en horizontal para que quepa en una hoja */
export const horizontal = (seccion: SeccionLab, informe: InformeVista) => seccion.id === 'patologia' && informe.muestras.length > 6;

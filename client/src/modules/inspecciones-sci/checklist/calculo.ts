// Cálculo de cumplimiento, igual que la hoja "Cumplimiento" del Excel:
// % = respuestas SI ÷ (respuestas SI + NO). Los N/A no cuentan; si todo es N/A no hay porcentaje.
import type { Respuesta } from './types';

export interface Conteo {
  si: number;
  no: number;
  na: number;
  sinResponder: number;
  total: number;
}

export function contar(respuestas: (Respuesta | null)[]): Conteo {
  const c: Conteo = { si: 0, no: 0, na: 0, sinResponder: 0, total: respuestas.length };
  for (const r of respuestas) {
    if (r === 'SI') c.si++;
    else if (r === 'NO') c.no++;
    else if (r === 'N/A') c.na++;
    else c.sinResponder++;
  }
  return c;
}

/** Fracción de cumplimiento (0 a 1), o null si no hay respuestas SI/NO */
export const cumplimiento = (c: Conteo): number | null => (c.si + c.no > 0 ? c.si / (c.si + c.no) : null);

export type Nivel = 'alto' | 'medio' | 'bajo';

/** Umbrales para colorear el cumplimiento (ajustables) */
export const UMBRALES = { alto: 0.8, medio: 0.5 };

export function nivel(fraccion: number): Nivel {
  if (fraccion >= UMBRALES.alto) return 'alto';
  if (fraccion >= UMBRALES.medio) return 'medio';
  return 'bajo';
}

export const NIVELES: Record<Nivel, { label: string; barra: string; texto: string }> = {
  alto: { label: 'Alto', barra: 'bg-emerald-500', texto: 'text-emerald-700 dark:text-emerald-300' },
  medio: { label: 'Medio', barra: 'bg-amber-500', texto: 'text-amber-700 dark:text-amber-300' },
  bajo: { label: 'Bajo', barra: 'bg-red-500', texto: 'text-red-700 dark:text-red-300' },
};

/** Nombres cortos de las áreas para tablas estrechas */
const NOMBRES_CORTOS: Record<string, string> = {
  'Bodega de balanceado': 'Balanceado',
  'Bodega de fertilizantes o químicos': 'Químicos',
  'Comedor y cocina': 'Comedor',
  'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo': 'Lubricantes / taller',
  'Otras generalidades': 'Generales',
};

export const nombreCorto = (seccion: string) => NOMBRES_CORTOS[seccion] ?? seccion.split(' ').slice(0, 2).join(' ');

/** Agrupa elementos por sección conservando el orden de aparición */
export function agruparPorSeccion<T extends { seccion: string }>(items: T[]): { seccion: string; items: T[] }[] {
  const grupos: { seccion: string; items: T[] }[] = [];
  for (const item of items) {
    const grupo = grupos.find((g) => g.seccion === item.seccion);
    if (grupo) grupo.items.push(item);
    else grupos.push({ seccion: item.seccion, items: [item] });
  }
  return grupos;
}

// Reglas de los informes de laboratorio (funciones puras, sin React).
import { miles } from '@/utils/numeros';
import type { CampoLab, SeccionLab } from '../types';

/** Ruta de la página de cada sección (la URL usa "patologias" en plural) */
export const RUTA_SECCION: Record<SeccionLab['id'], string> = {
  agua: '/laboratorios/agua',
  suelo: '/laboratorios/suelo',
  patologia: '/laboratorios/patologias',
};

/** Análisis que forman el tipo guardado: "fitoplancton+quimico" → ['fitoplancton', 'quimico'] */
export const partesDelTipo = (tipo: string) => tipo.split('+');

const aplica = (soloTipos: string[] | undefined, tipo: string) => !soloTipos || soloTipos.some((t) => partesDelTipo(tipo).includes(t));

/** Campos que aplican a un tipo de informe (en las secciones combinables, los de cualquiera de sus análisis) */
export const camposDelTipo = (seccion: SeccionLab, tipo: string) => seccion.campos.filter((c) => aplica(c.soloTipos, tipo));

export const gruposDelTipo = (seccion: SeccionLab, tipo: string) => seccion.grupos.filter((g) => aplica(g.soloTipos, tipo));

const tiposDe = (seccion: SeccionLab, tipo: string) => seccion.tipos.filter((t) => partesDelTipo(tipo).includes(t.id));

/** Ej. "Patología, una sola muestra" o, en las combinables, "Fitoplancton + Químico" */
export function nombreTipo(seccion: SeccionLab, tipo: string) {
  const tipos = tiposDe(seccion, tipo);
  if (!tipos.length) return tipo;
  return seccion.combinable ? tipos.map((t) => t.corto ?? t.nombre).join(' + ') : tipos[0].nombre;
}

/** Tipo de un informe nuevo: en las combinables, todos los análisis marcados */
export const tipoInicial = (seccion: SeccionLab) => (seccion.combinable ? seccion.tipos.map((t) => t.id).join('+') : seccion.tipos[0].id);

/** Marca o desmarca un análisis (queda al menos uno, en el orden de la definición) */
export function alternarTipo(seccion: SeccionLab, tipo: string, id: string) {
  const partes = partesDelTipo(tipo);
  const nuevas = partes.includes(id) ? partes.filter((p) => p !== id) : [...partes, id];
  if (!nuevas.length) return tipo;
  return seccion.tipos
    .filter((t) => nuevas.includes(t.id))
    .map((t) => t.id)
    .join('+');
}

/** Tipo del informe que exige una sola muestra (si lo hay) */
export const tipoUnaMuestra = (seccion: SeccionLab, tipo: string) => tiposDe(seccion, tipo).find((t) => t.unaMuestra);

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
  if (campo.max != null) return `Ref. máx. ${fmt(campo.max)}`;
  return '';
}

const fmt = (n: number) => String(n).replace('.', ',');

/** Valor fuera de su referencia: supera el máximo ('alto') o no llega al mínimo ('bajo') */
export type EstadoReferencia = 'alto' | 'bajo';

/** Indicador de color (siempre con flecha y texto, nunca solo color); el informe impreso usa los mismos colores */
export const ESTADOS_REFERENCIA: Record<EstadoReferencia, { flecha: string; texto: string; clase: string }> = {
  alto: { flecha: '▲', texto: 'Sobre el valor referencial', clase: 'text-red-600 dark:text-red-400' },
  bajo: { flecha: '▼', texto: 'Bajo el valor referencial', clase: 'text-blue-600 dark:text-blue-400' },
};

/**
 * Compara un valor con su referencia: el rango min – max del parámetro o, en Ca, Mg y K,
 * el valor referencial de la muestra (factor × salinidad). null si está dentro o no tiene referencia.
 */
export function estadoReferencia(campo: CampoLab, valor: number | null, salinidad: number | null): EstadoReferencia | null {
  if (valor == null || campo.escala) return null;
  if (campo.factorSalinidad) {
    if (!salinidad) return null;
    const referencia = campo.factorSalinidad * salinidad;
    return valor > referencia ? 'alto' : valor < referencia ? 'bajo' : null;
  }
  if (campo.min != null && valor < campo.min) return 'bajo';
  if (campo.max != null && valor > campo.max) return 'alto';
  return null;
}

/** Ayuda bajo cada valor del formulario: nivel de patología, o referencia calculada y si está fuera de ella */
export function evaluarReferencia(campo: CampoLab, valor: number | null, salinidad: number | null) {
  if (valor == null) return null;
  if (campo.escala === 'patologia') return { tipo: 'nivel' as const, nivel: nivelPatologia(valor) };
  const estado = estadoReferencia(campo, valor, salinidad);
  const calculada = campo.factorSalinidad && salinidad ? `ref. ${miles(campo.factorSalinidad * salinidad)}` : '';
  if (!estado && !calculada) return null;
  const fuera = estado ? `${ESTADOS_REFERENCIA[estado].flecha} ${estado}` : '';
  return { tipo: 'referencia' as const, estado, texto: [calculada, fuera].filter(Boolean).join(' · ') };
}

/** Total de fitoplancton (suma de los grupos) de una muestra de agua */
export const CLAVES_FITOPLANCTON = ['diatomeas', 'cianofitas', 'clorofitas', 'dinoflagelados', 'otros_fito'];

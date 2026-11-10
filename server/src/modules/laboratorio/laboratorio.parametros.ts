// Parámetros del análisis químico de agua, editables en Configuración: se agregan, se quitan y se cambian su
// fórmula, unidad y referencia sin tocar el código. Se guardan en la tabla `configuracion` (clave abajo); sin
// guardar, rigen los de fábrica. Un parámetro quitado se conserva oculto para que los informes que ya tienen
// su valor lo sigan mostrando.
import { consultarUna, ejecutar } from '../../db/database.js';
import { texto, type Validado } from '../../utils/validacion.js';
import { valoresListas } from '../configuracion/configuracion.service.js';
import { SECCIONES, type CampoLab, type SeccionId, type SeccionLab } from './laboratorio.secciones.js';

const CLAVE_CONFIG = 'laboratorio.parametros_quimicos';
const MAX_PARAMETROS = 40;

export interface ParametroQuimico {
  clave: string;
  /** Nombre del parámetro, ej. Amonio */
  nombre: string;
  /** Fórmula o nomenclatura: encabezado de su columna en el informe impreso, ej. N-NH₄ */
  formula: string;
  unidad: string;
  /** Rango de referencia (opcional) */
  min?: number;
  max?: number;
  /** Referencia = factor × salinidad de la muestra (Ca, Mg, K); reemplaza al rango */
  factorSalinidad?: number;
  /** Quitado: no se ofrece en informes nuevos */
  oculto?: boolean;
}

/** Los de fábrica (los del formato oficial AA) */
export const PARAMETROS_INICIALES: ParametroQuimico[] = [
  { clave: 'fosfato', nombre: 'Fosfato', formula: 'PO₄⁻³', unidad: 'mg/L', min: 0.6, max: 1.5 },
  { clave: 'amonio', nombre: 'Amonio', formula: 'N-NH₄', unidad: 'mg/L', min: 0.1, max: 1 },
  { clave: 'nitrito', nombre: 'Nitrito', formula: 'NO²⁻', unidad: 'mg/L' },
  { clave: 'nitrato', nombre: 'Nitrato', formula: 'NO³⁻', unidad: 'mg/L' },
  { clave: 'calcio', nombre: 'Calcio', formula: 'Ca++', unidad: 'mg/L', factorSalinidad: 11.6 },
  { clave: 'magnesio', nombre: 'Magnesio', formula: 'Mg++', unidad: 'mg/L', factorSalinidad: 39.1 },
  { clave: 'potasio', nombre: 'Potasio', formula: 'K+', unidad: 'mg/L', factorSalinidad: 10.7 },
];

/** Claves que no puede tomar un parámetro nuevo (las de los demás campos de Análisis de Agua) */
const CLAVES_RESERVADAS = new Set(SECCIONES.agua.campos.filter((c) => c.grupo !== 'quimica').map((c) => c.clave));

export async function obtenerParametros(): Promise<{ parametros: ParametroQuimico[]; editados: boolean }> {
  const fila = await consultarUna('SELECT valor FROM configuracion WHERE clave = ?', [CLAVE_CONFIG]);
  if (fila) {
    try {
      const v = JSON.parse(String(fila.valor));
      if (Array.isArray(v) && v.length) return { parametros: v as ParametroQuimico[], editados: true };
    } catch {
      // valor dañado: rigen los de fábrica
    }
  }
  return { parametros: PARAMETROS_INICIALES, editados: false };
}

export async function guardarParametros(parametros: ParametroQuimico[]): Promise<void> {
  await ejecutar(
    `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
    [CLAVE_CONFIG, JSON.stringify(parametros)],
  );
}

/** Vuelve a los de fábrica; los agregados se conservan ocultos (hay informes que pueden tenerlos) */
export async function restaurarParametros(): Promise<ParametroQuimico[]> {
  const { parametros } = await obtenerParametros();
  const agregados = parametros.filter((p) => !PARAMETROS_INICIALES.some((i) => i.clave === p.clave)).map((p) => ({ ...p, oculto: true }));
  if (!agregados.length) {
    await ejecutar('DELETE FROM configuracion WHERE clave = ?', [CLAVE_CONFIG]);
    return PARAMETROS_INICIALES;
  }
  const todos = [...PARAMETROS_INICIALES, ...agregados];
  await guardarParametros(todos);
  return todos;
}

/** Clave a partir del nombre: "Sílice" → "silice" (única) */
function claveNueva(nombre: string, usadas: Set<string>): string {
  const base =
    nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30) || 'parametro';
  let clave = base;
  for (let n = 2; usadas.has(clave) || CLAVES_RESERVADAS.has(clave); n++) clave = `${base}_${n}`;
  return clave;
}

const numeroOpcional = (v: unknown): number | undefined | null => {
  if (v === undefined || v === null || v === '') return undefined;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
};

/**
 * Valida la lista enviada (en el orden en que debe salir). Los parámetros que estaban y ya no vienen se
 * conservan ocultos, para no perder cómo se muestran en los informes que los tienen.
 */
export function validarParametros(body: Record<string, unknown> | undefined, anteriores: ParametroQuimico[]): Validado<ParametroQuimico[]> {
  if (!Array.isArray(body?.parametros)) return { error: 'Faltan los parámetros.' };
  if (body.parametros.length > MAX_PARAMETROS) return { error: `Máximo ${MAX_PARAMETROS} parámetros.` };
  const usadas = new Set(anteriores.map((p) => p.clave));
  const resultado: ParametroQuimico[] = [];
  for (const [i, e] of (body.parametros as Record<string, unknown>[]).entries()) {
    const nombre = texto(e?.nombre, 40);
    if (!nombre) return { error: `Falta el nombre del parámetro ${i + 1}.` };
    if (resultado.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase())) return { error: `"${nombre}" está repetido.` };
    const formula = texto(e?.formula, 20);
    const unidad = texto(e?.unidad, 20);
    const min = numeroOpcional(e?.min);
    const max = numeroOpcional(e?.max);
    const factor = numeroOpcional(e?.factorSalinidad);
    if (min === null || max === null || factor === null) return { error: `Los valores de referencia de "${nombre}" deben ser números mayores o iguales a 0.` };
    if (min !== undefined && max !== undefined && min > max) return { error: `En "${nombre}" el mínimo de referencia es mayor que el máximo.` };
    if (factor === 0) return { error: `El factor de salinidad de "${nombre}" debe ser mayor que 0.` };
    // Un parámetro que ya existía conserva su clave (ahí están sus valores guardados); uno nuevo recibe una
    // Si se vuelve a agregar uno que se había quitado (mismo nombre), recupera su clave y sus valores
    const previa =
      (typeof e?.clave === 'string' && anteriores.some((p) => p.clave === e.clave) ? e.clave : null) ??
      anteriores.find((p) => p.nombre.toLowerCase() === nombre.toLowerCase() && !resultado.some((r) => r.clave === p.clave))?.clave ??
      null;
    if (previa && resultado.some((p) => p.clave === previa)) return { error: `"${nombre}" está repetido.` };
    const clave = previa ?? claveNueva(nombre, usadas);
    usadas.add(clave);
    const p: ParametroQuimico = { clave, nombre, formula, unidad };
    if (factor !== undefined) p.factorSalinidad = factor;
    else {
      if (min !== undefined) p.min = min;
      if (max !== undefined) p.max = max;
    }
    if (e?.oculto === true) p.oculto = true;
    resultado.push(p);
  }
  if (!resultado.some((p) => !p.oculto)) return { error: 'Deje al menos un parámetro químico.' };
  // Los que se quitaron de la lista se guardan ocultos
  for (const a of anteriores) if (!resultado.some((p) => p.clave === a.clave)) resultado.push({ ...a, oculto: true });
  return { datos: resultado };
}

/** Parámetro → campo del formulario e informe */
export const aCampo = (p: ParametroQuimico): CampoLab => ({
  clave: p.clave,
  etiqueta: p.formula ? `${p.nombre} ${p.formula}` : p.nombre,
  nombre: p.nombre,
  formula: p.formula,
  tipo: 'numero',
  ...(p.unidad ? { unidad: p.unidad } : {}),
  grupo: 'quimica',
  soloTipos: ['quimico'],
  ...(p.min !== undefined ? { min: p.min } : {}),
  ...(p.max !== undefined ? { max: p.max } : {}),
  ...(p.factorSalinidad !== undefined ? { factorSalinidad: p.factorSalinidad } : {}),
  ...(p.oculto ? { oculto: true } : {}),
});

/**
 * Definición vigente de las secciones: la de fábrica con lo editado en Configuración (géneros, clientes y los
 * parámetros químicos del agua, en el lugar de los de fábrica).
 */
export async function seccionesVigentes(): Promise<{ secciones: Record<SeccionId, SeccionLab>; clientes: string[] }> {
  const [listas, { parametros }] = await Promise.all([valoresListas(), obtenerParametros()]);
  const secciones = Object.fromEntries(
    Object.entries(SECCIONES).map(([id, s]) => {
      let campos = s.campos.map((c) => (c.opciones ? { ...c, opciones: listas[`laboratorio.${c.clave}`] ?? c.opciones } : c));
      if (id === 'agua') {
        const inicio = campos.findIndex((c) => c.grupo === 'quimica');
        const sinQuimica = campos.filter((c) => c.grupo !== 'quimica');
        campos = [...sinQuimica.slice(0, inicio), ...parametros.map(aCampo), ...sinQuimica.slice(inicio)];
      }
      return [id, { ...s, campos }];
    }),
  ) as Record<SeccionId, SeccionLab>;
  return { secciones, clientes: listas['laboratorio.clientes'] };
}

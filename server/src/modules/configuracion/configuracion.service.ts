import { consultar, ejecutar } from '../../db/database.js';
import type { Validado } from '../../utils/validacion.js';
import { LISTAS, listaPorId, type ListaEditable } from './configuracion.listas.js';

const MAX_VALORES = 200;
const MAX_LARGO = 80;
const clave = (id: string) => `lista.${id}`;

export interface ListaConValores extends ListaEditable {
  valores: string[];
  /** true si se editó (si no, son los valores de fábrica) */
  editada: boolean;
}

/** Valores guardados de las listas editadas (id → valores) */
async function guardadas(): Promise<Map<string, string[]>> {
  const filas = await consultar("SELECT clave, valor FROM configuracion WHERE clave LIKE 'lista.%'");
  const mapa = new Map<string, string[]>();
  for (const f of filas) {
    try {
      const v = JSON.parse(String(f.valor));
      if (Array.isArray(v)) mapa.set(String(f.clave).slice('lista.'.length), v.map(String));
    } catch {
      // valor dañado: se usan los de fábrica
    }
  }
  return mapa;
}

export async function listasConValores(): Promise<ListaConValores[]> {
  const g = await guardadas();
  return LISTAS.map((l) => ({ ...l, valores: g.get(l.id) ?? l.inicial, editada: g.has(l.id) }));
}

/** Valores vigentes de cada lista (id → valores) */
export async function valoresListas(): Promise<Record<string, string[]>> {
  return Object.fromEntries((await listasConValores()).map((l) => [l.id, l.valores]));
}

export async function valoresLista(id: string): Promise<string[] | null> {
  const lista = listaPorId(id);
  if (!lista) return null;
  return (await guardadas()).get(id) ?? lista.inicial;
}

export async function guardarLista(id: string, valores: string[]): Promise<void> {
  await ejecutar(
    `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
    [clave(id), JSON.stringify(valores)],
  );
}

/** Vuelve a los valores de fábrica */
export async function restaurarLista(id: string): Promise<void> {
  await ejecutar('DELETE FROM configuracion WHERE clave = ?', [clave(id)]);
}

export function validarValores(lista: ListaEditable, body: Record<string, unknown> | undefined): Validado<string[]> {
  if (!Array.isArray(body?.valores)) return { error: 'Faltan los valores de la lista.' };
  const valores: string[] = [];
  for (const v of body.valores) {
    const t = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
    if (!t) continue;
    if (t.length > MAX_LARGO) return { error: `"${t.slice(0, 30)}…" es demasiado largo (máximo ${MAX_LARGO} caracteres).` };
    if (lista.sinEspacios && t.includes(' ')) return { error: `"${t}" debe ser una sola palabra (ej. Nitzschia).` };
    if (valores.some((x) => x.toLowerCase() === t.toLowerCase())) return { error: `"${t}" está repetido.` };
    valores.push(t);
  }
  if (!valores.length) return { error: 'La lista debe tener al menos un valor.' };
  if (valores.length > MAX_VALORES) return { error: `Máximo ${MAX_VALORES} valores por lista.` };
  return { datos: valores };
}

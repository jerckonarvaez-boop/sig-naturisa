// Cálculo del ahorro por reparar partes de oxigenómetros (funciones puras, sin React).
// Las reparaciones las hace el personal de la empresa (sin costo): el ahorro es lo que no se gastó
// en comprar la parte nueva.
import type { BarListItem } from '@/components/charts/BarList';
import { MESES } from '@/constants/fechas';
import type { ItemCatalogo } from '@/services/api/catalogo';
import { dinero, miles } from '@/utils/numeros';
import { ES_REPUESTO_OXIGENOMETRO } from '../config';
import type { Reparacion } from '../types';

/** Ahorro de una reparación: precio de la parte nueva × cantidad (solo si quedó reparada) */
export const ahorroDe = (r: Reparacion) => (r.estado === 'reparado' ? r.precioNuevo * r.cantidad : 0);

export const anioDe = (r: Reparacion) => Number(r.fecha.slice(0, 4));

/** Años con reparaciones, del más reciente al más antiguo */
export const aniosDisponibles = (lista: Reparacion[]) => [...new Set(lista.map(anioDe))].sort((a, b) => b - a);

/** null = todos los años */
export const filtrarPorAnio = (lista: Reparacion[], anio: number | null) => (anio == null ? lista : lista.filter((r) => anioDe(r) === anio));

const partes = (lista: Reparacion[]) => lista.reduce((t, r) => t + r.cantidad, 0);

export interface ResumenAhorro {
  /** Partes reparadas (suma de cantidades) */
  partesReparadas: number;
  /** Lo que habría costado comprar nuevas las partes reparadas */
  ahorro: number;
  promedioPorParte: number;
  enReparacion: number;
  noReparables: number;
}

export function resumir(lista: Reparacion[]): ResumenAhorro {
  const reparadas = lista.filter((r) => r.estado === 'reparado');
  const partesReparadas = partes(reparadas);
  const ahorro = reparadas.reduce((t, r) => t + ahorroDe(r), 0);
  return {
    partesReparadas,
    ahorro,
    promedioPorParte: partesReparadas ? ahorro / partesReparadas : 0,
    enReparacion: partes(lista.filter((r) => r.estado === 'en-reparacion')),
    noReparables: partes(lista.filter((r) => r.estado === 'no-reparable')),
  };
}

/** Ahorro de cada mes del año (o de todos los años juntos), con las partes reparadas en el detalle */
export function ahorroPorMes(lista: Reparacion[]): BarListItem[] {
  return MESES.map((nombre, i) => {
    const delMes = lista.filter((r) => r.estado === 'reparado' && Number(r.fecha.slice(5, 7)) - 1 === i);
    const n = partes(delMes);
    return {
      key: String(i),
      label: nombre,
      valor: delMes.reduce((t, r) => t + ahorroDe(r), 0),
      detalle: n ? `${miles(n)} ${n === 1 ? 'parte reparada' : 'partes reparadas'}` : 'Sin reparaciones',
    };
  });
}

/** Ahorro por tipo de parte, de mayor a menor */
export function ahorroPorParte(lista: Reparacion[]): BarListItem[] {
  const grupos = new Map<string, { ahorro: number; partes: number }>();
  for (const r of lista) {
    if (r.estado !== 'reparado') continue;
    const g = grupos.get(r.parte) ?? { ahorro: 0, partes: 0 };
    g.ahorro += ahorroDe(r);
    g.partes += r.cantidad;
    grupos.set(r.parte, g);
  }
  return [...grupos]
    .sort((a, b) => b[1].ahorro - a[1].ahorro)
    .map(([parte, g]) => ({
      key: parte,
      label: parte,
      valor: g.ahorro,
      detalle: `${miles(g.partes)} ${g.partes === 1 ? 'reparada' : 'reparadas'} · ${dinero(g.ahorro / g.partes, 2)} c/u`,
    }));
}

const unicos = (valores: string[]) => [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

/** Sugerencias del formulario a partir de las reparaciones ya registradas */
export function sugerenciasDe(lista: Reparacion[]) {
  // La lista viene de la más reciente a la más antigua: el primer precio encontrado es el último usado
  const ultimoPrecio = new Map<string, number>();
  for (const r of lista) if (!ultimoPrecio.has(r.parte.toLowerCase())) ultimoPrecio.set(r.parte.toLowerCase(), r.precioNuevo);
  return {
    partesUsadas: unicos(lista.map((r) => r.parte)),
    equipos: unicos(lista.map((r) => r.equipo)),
    responsables: unicos(lista.map((r) => r.responsable)),
    ultimoPrecio,
  };
}

export type SugerenciasReparacion = ReturnType<typeof sugerenciasDe>;

/**
 * Lista de partes para elegir: ítems del presupuesto (primero los que parecen repuestos de
 * oxigenómetro) y luego las partes ya registradas que no estén en el presupuesto.
 */
export function partesParaElegir(items: ItemCatalogo[], partesUsadas: string[]): string[] {
  const nombres = items.map((i) => i.nombre);
  const primero = nombres.filter((n) => ES_REPUESTO_OXIGENOMETRO.test(n));
  const resto = nombres.filter((n) => !ES_REPUESTO_OXIGENOMETRO.test(n));
  const enCatalogo = new Set(nombres.map((n) => n.toLowerCase()));
  return [...primero, ...partesUsadas.filter((p) => !enCatalogo.has(p.toLowerCase())), ...resto];
}

/** Precio sugerido para una parte: el de su última compra en el presupuesto o, si no está, el último usado */
export function precioSugerido(parte: string, items: ItemCatalogo[], sugerencias: SugerenciasReparacion) {
  const clave = parte.trim().toLowerCase();
  if (!clave) return null;
  const item = items.find((i) => i.nombre.toLowerCase() === clave);
  if (item) return { precio: item.precioUnitario, origen: 'presupuesto' as const, fecha: item.ultimaCompra };
  const usado = sugerencias.ultimoPrecio.get(clave);
  return usado != null ? { precio: usado, origen: 'reparaciones' as const, fecha: '' } : null;
}

// Cálculo del ahorro por reparar partes de oxigenómetros (funciones puras, sin React).
import type { BarListItem } from '@/components/charts/BarList';
import { MESES } from '@/constants/fechas';
import { dinero, miles } from '@/utils/numeros';
import { PARTES_SUGERIDAS } from '../config';
import type { Reparacion } from '../types';

/** Ahorro de una reparación: lo que costaría comprar nuevo menos lo que costó reparar (solo si quedó reparada) */
export const ahorroDe = (r: Reparacion) => (r.estado === 'reparado' ? (r.precioNuevo - r.costoReparacion) * r.cantidad : 0);

export const anioDe = (r: Reparacion) => Number(r.fecha.slice(0, 4));

/** Años con reparaciones, del más reciente al más antiguo */
export const aniosDisponibles = (lista: Reparacion[]) => [...new Set(lista.map(anioDe))].sort((a, b) => b - a);

/** null = todos los años */
export const filtrarPorAnio = (lista: Reparacion[], anio: number | null) => (anio == null ? lista : lista.filter((r) => anioDe(r) === anio));

export interface ResumenAhorro {
  /** Partes reparadas (suma de cantidades) */
  partesReparadas: number;
  /** Lo que habría costado comprar nuevas las partes reparadas */
  costoNuevo: number;
  /** Lo que costó repararlas */
  costoReparacion: number;
  ahorro: number;
  /** Ahorro / costo de comprar nuevo (0 a 1) */
  porcentaje: number;
  enReparacion: number;
  noReparables: number;
}

export function resumir(lista: Reparacion[]): ResumenAhorro {
  const reparadas = lista.filter((r) => r.estado === 'reparado');
  const suma = (f: (r: Reparacion) => number, l = reparadas) => l.reduce((t, r) => t + f(r), 0);
  const costoNuevo = suma((r) => r.precioNuevo * r.cantidad);
  const costoReparacion = suma((r) => r.costoReparacion * r.cantidad);
  return {
    partesReparadas: suma((r) => r.cantidad),
    costoNuevo,
    costoReparacion,
    ahorro: costoNuevo - costoReparacion,
    porcentaje: costoNuevo > 0 ? (costoNuevo - costoReparacion) / costoNuevo : NaN,
    enReparacion: suma((r) => r.cantidad, lista.filter((r) => r.estado === 'en-reparacion')),
    noReparables: suma((r) => r.cantidad, lista.filter((r) => r.estado === 'no-reparable')),
  };
}

/** Ahorro de cada mes del año (o de todos los años juntos), con las partes reparadas en el detalle */
export function ahorroPorMes(lista: Reparacion[]): BarListItem[] {
  return MESES.map((nombre, i) => {
    const delMes = lista.filter((r) => r.estado === 'reparado' && Number(r.fecha.slice(5, 7)) - 1 === i);
    const partes = delMes.reduce((t, r) => t + r.cantidad, 0);
    return {
      key: String(i),
      label: nombre,
      valor: delMes.reduce((t, r) => t + ahorroDe(r), 0),
      detalle: partes ? `${miles(partes)} ${partes === 1 ? 'parte reparada' : 'partes reparadas'}` : 'Sin reparaciones',
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
      detalle: `${miles(g.partes)} ${g.partes === 1 ? 'reparada' : 'reparadas'} · ${dinero(g.ahorro / g.partes, 2)} por parte`,
    }));
}

const unicos = (valores: string[]) => [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

/** Sugerencias para el formulario y último precio usado de cada parte */
export function sugerenciasDe(lista: Reparacion[]) {
  // La lista viene de la más reciente a la más antigua: el primer precio encontrado es el último usado
  const ultimoPrecio = new Map<string, { precioNuevo: number; costoReparacion: number }>();
  for (const r of lista) {
    if (!ultimoPrecio.has(r.parte.toLowerCase())) {
      ultimoPrecio.set(r.parte.toLowerCase(), { precioNuevo: r.precioNuevo, costoReparacion: r.costoReparacion });
    }
  }
  return {
    partes: unicos([...PARTES_SUGERIDAS, ...lista.map((r) => r.parte)]),
    equipos: unicos(lista.map((r) => r.equipo)),
    sucursales: unicos(lista.map((r) => r.sucursal)),
    responsables: unicos(lista.map((r) => r.responsable)),
    ultimoPrecio,
  };
}

export type SugerenciasReparacion = ReturnType<typeof sugerenciasDe>;

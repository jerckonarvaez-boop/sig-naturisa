// Cálculos del presupuesto (funciones puras: no dependen de React ni de la interfaz)
import type { FiltroCruzado, Filtros, Gasto, PresupuestoData, Registro } from './types';

export const AREA_GENERAL = 'General';

export function prepararRegistros(gastos: Gasto[]): Registro[] {
  return gastos.map((g) => ({
    ...g,
    anio: g.fechaSolped ? Number(g.fechaSolped.slice(0, 4)) : null,
    mes: g.fechaSolped ? Number(g.fechaSolped.slice(5, 7)) - 1 : null,
    sucursalNombre: g.sucursal || 'Sin sucursal',
    itemNombre: g.item || g.notaGeneral || 'Sin ítem',
  }));
}

/** Áreas con presupuesto + las que solo tienen gastos */
export function areasDisponibles(data: PresupuestoData, registros: Registro[]): string[] {
  const areas = data.presupuestoArea.map((p) => p.area);
  for (const r of registros) if (r.area && !areas.includes(r.area)) areas.push(r.area);
  return areas;
}

export function aniosDisponibles(registros: Registro[]): number[] {
  return [...new Set(registros.map((r) => r.anio).filter((a): a is number => a != null))].sort((a, b) => b - a);
}

/**
 * Aplica los filtros activos. `ignorar` excluye un filtro cruzado: así el gráfico que
 * originó el filtro sigue mostrando todas sus opciones (con la elegida resaltada).
 */
export function filtrar(registros: Registro[], f: Filtros, ignorar?: FiltroCruzado): Registro[] {
  return registros.filter(
    (r) =>
      (f.area === AREA_GENERAL || r.area === f.area) &&
      (!f.anio || r.anio === f.anio) &&
      (ignorar === 'sucursal' || !f.sucursal || r.sucursalNombre === f.sucursal) &&
      (ignorar === 'item' || !f.item || r.itemNombre === f.item) &&
      (ignorar === 'subarea' || !f.subarea || r.subarea === f.subarea) &&
      (ignorar === 'mes' || f.mes == null || r.mes === f.mes),
  );
}

export const sumar = <T>(lista: T[], valor: (x: T) => number) => lista.reduce((acc, x) => acc + valor(x), 0);

export const totalGasto = (registros: Registro[]) => sumar(registros, (r) => r.total);

export function agrupar<K>(registros: Registro[], clave: (r: Registro) => K): Map<K, number> {
  const mapa = new Map<K, number>();
  for (const r of registros) {
    const k = clave(r);
    mapa.set(k, (mapa.get(k) ?? 0) + r.total);
  }
  return mapa;
}

/** Presupuesto que corresponde a la vista actual (general, área o sub-área). */
export function presupuestoVigente(data: PresupuestoData, f: Filtros): number {
  if (f.subarea) {
    return sumar(
      data.presupuestoSubarea.filter((p) => p.subarea === f.subarea && (f.area === AREA_GENERAL || p.area === f.area)),
      (p) => p.monto,
    );
  }
  if (f.area !== AREA_GENERAL) return data.presupuestoArea.find((p) => p.area === f.area)?.monto ?? 0;
  return sumar(data.presupuestoArea, (p) => p.monto);
}

/** Gasto proyectado a 12 meses según el ritmo mensual promedio. NaN si hay un mes filtrado. */
export function proyeccionCierre(gasto: number, f: Filtros, hoy = new Date()): number {
  if (f.mes != null) return NaN;
  const meses = f.anio === hoy.getFullYear() ? hoy.getMonth() + 1 : 12;
  return (gasto / meses) * 12;
}

/** Texto sin tildes, minúsculas y sin símbolos (para búsquedas) */
export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function buscar(registros: Registro[], texto: string): Registro[] {
  const q = normalizar(texto);
  if (!q) return registros;
  return registros.filter((r) =>
    normalizar(
      [r.notaGeneral, r.item, r.notaPosicion, r.subarea, r.cluster, r.sucursal, r.solped, r.proveedor, r.estado, r.ocErp].join(' '),
    ).includes(q),
  );
}

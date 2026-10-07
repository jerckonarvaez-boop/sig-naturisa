// Datos de cada gráfico del tablero de presupuesto (funciones puras, sin React).
// Cada gráfico ignora su propio filtro cruzado para que se pueda cambiar la selección.
import type { BarListItem } from '@/components/charts/BarList';
import type { BudgetBarItem } from '@/components/charts/BudgetBars';
import type { ColumnItem } from '@/components/charts/ColumnChart';
import { MESES_LARGO } from '@/constants/fechas';
import { dinero } from '@/utils/numeros';
import type { Filtros, PresupuestoData, Registro } from '../types';
import { agrupar, AREA_GENERAL, filtrar } from './logica';

/** El área solo se muestra como subtítulo si no repite el nombre de la sub-área */
const otraArea = (area: string | undefined, subarea: string) => (area && area !== subarea ? area : undefined);

/** Gasto y presupuesto por área (vista general) */
export function gastoPorArea(registros: Registro[], filtros: Filtros, areas: string[], data: PresupuestoData): ColumnItem[] {
  const g = agrupar(filtrar(registros, filtros), (r) => r.area);
  return areas.map((a) => ({
    key: a,
    label: a,
    valor: g.get(a) ?? 0,
    presupuesto: data.presupuestoArea.find((p) => p.area === a)?.monto ?? 0,
  }));
}

/** Los 10 ítems con mayor gasto (vista de un área) */
export function itemsConMayorGasto(registros: Registro[], filtros: Filtros): BarListItem[] {
  const g = agrupar(filtrar(registros, filtros, 'item'), (r) => r.itemNombre);
  return [...g].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, valor]) => ({ key, label: key, valor }));
}

/** Gasto por sucursal, de mayor a menor (sin las que suman cero) */
export function gastoPorSucursal(registros: Registro[], filtros: Filtros): BarListItem[] {
  const g = agrupar(filtrar(registros, filtros, 'sucursal'), (r) => r.sucursalNombre);
  return [...g]
    .filter(([, v]) => v !== 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, valor]) => ({ key, label: key, valor }));
}

/** Presupuesto vs. gasto por sub-área (incluye sub-áreas con gasto pero sin presupuesto) */
export function presupuestoPorSubarea(registros: Registro[], filtros: Filtros, data: PresupuestoData): BudgetBarItem[] {
  const base = filtrar(registros, filtros, 'subarea');
  const g = agrupar(base, (r) => r.subarea);
  const items = new Map<string, { key: string; label: string; sublabel?: string; gasto: number; presupuesto: number }>();
  for (const p of data.presupuestoSubarea) {
    if (filtros.area !== AREA_GENERAL && p.area !== filtros.area) continue;
    const previo = items.get(p.subarea);
    items.set(p.subarea, {
      key: p.subarea,
      label: p.subarea,
      sublabel: filtros.area === AREA_GENERAL ? otraArea(p.area, p.subarea) : undefined,
      gasto: 0,
      presupuesto: (previo?.presupuesto ?? 0) + p.monto,
    });
  }
  for (const [subarea, valor] of g) {
    if (!subarea || subarea === '0') continue;
    const item = items.get(subarea) ?? {
      key: subarea,
      label: subarea,
      sublabel: filtros.area === AREA_GENERAL ? otraArea(base.find((r) => r.subarea === subarea)?.area, subarea) : undefined,
      gasto: 0,
      presupuesto: 0,
    };
    item.gasto = valor;
    items.set(subarea, item);
  }
  let lista = [...items.values()].sort((a, b) => (b.presupuesto || b.gasto) - (a.presupuesto || a.gasto));
  if (filtros.item || filtros.sucursal || filtros.mes != null) {
    lista = lista.filter((i) => i.gasto > 0 || i.key === filtros.subarea);
  }
  return lista;
}

/** Gasto de cada mes del año, con el acumulado en el detalle */
export function gastoPorMes(registros: Registro[], filtros: Filtros): BarListItem[] {
  const g = agrupar(filtrar(registros, filtros, 'mes'), (r) => r.mes);
  let acumulado = 0;
  return MESES_LARGO.map((nombre, i) => {
    const valor = g.get(i) ?? 0;
    acumulado += valor;
    return {
      key: String(i),
      label: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      valor,
      detalle: valor ? `Acumulado a ${nombre}: ${dinero(acumulado, 2)}` : 'Sin gastos registrados',
    };
  });
}

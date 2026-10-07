import { useCallback, useEffect, useMemo, useState } from 'react';
import { dinero } from '@/utils/numeros';
import { gastoPorArea, gastoPorMes, gastoPorSucursal, itemsConMayorGasto, presupuestoPorSubarea } from '../logic/agregaciones';
import {
  AREA_GENERAL,
  aniosDisponibles,
  areasDisponibles,
  buscar,
  filtrar,
  prepararRegistros,
  presupuestoVigente,
  proyeccionCierre,
  totalGasto,
} from '../logic/logica';
import type { FiltroCruzado, Filtros, PresupuestoData } from '../types';

const FILTROS_INICIALES: Filtros = {
  area: AREA_GENERAL,
  anio: null,
  sucursal: null,
  item: null,
  subarea: null,
  mes: null,
  busqueda: '',
};

/** Filtro que se quita desde la barra de filtros ('todo' = todos los cruzados y la búsqueda) */
export type FiltroQuitable = FiltroCruzado | 'busqueda' | 'todo';

/** Estado de los filtros del tablero y todos los datos calculados que muestran sus gráficos. */
export function useTablero(data: PresupuestoData) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);

  const registros = useMemo(() => prepararRegistros(data.gastos), [data]);
  const areas = useMemo(() => areasDisponibles(data, registros), [data, registros]);
  const anios = useMemo(() => aniosDisponibles(registros), [registros]);

  // Año por defecto: el actual si tiene datos; si no, el más reciente
  useEffect(() => {
    if (filtros.anio != null && anios.includes(filtros.anio)) return;
    const actual = new Date().getFullYear();
    setFiltros((f) => ({ ...f, anio: anios.includes(actual) ? actual : (anios[0] ?? null) }));
  }, [anios, filtros.anio]);

  // --- acciones
  /** Selecciona un valor en un gráfico, o lo quita si ya estaba seleccionado */
  const alternar = <K extends FiltroCruzado>(clave: K, valor: Filtros[K]) =>
    setFiltros((f) => ({ ...f, [clave]: f[clave] === valor ? null : valor }));

  const cambiarArea = (area: string) => setFiltros((f) => ({ ...f, area, subarea: null, item: null, busqueda: '' }));

  const cambiarAnio = (anio: number | null) => setFiltros((f) => ({ ...f, anio }));

  const quitarFiltro = (clave: FiltroQuitable) =>
    setFiltros((f) =>
      clave === 'todo'
        ? { ...f, sucursal: null, item: null, subarea: null, mes: null, busqueda: '' }
        : { ...f, [clave]: clave === 'busqueda' ? '' : null },
    );

  const buscarTexto = useCallback(
    (busqueda: string) => setFiltros((f) => (f.busqueda === busqueda ? f : { ...f, busqueda })),
    [],
  );

  // --- datos calculados
  const filtrados = useMemo(() => filtrar(registros, filtros), [registros, filtros]);
  const gasto = totalGasto(filtrados);
  const presupuesto = presupuestoVigente(data, filtros);
  const detalle = useMemo(() => buscar(filtrados, filtros.busqueda), [filtrados, filtros.busqueda]);

  const porArea = useMemo(() => gastoPorArea(registros, filtros, areas, data), [registros, filtros, areas, data]);
  const porItem = useMemo(() => itemsConMayorGasto(registros, filtros), [registros, filtros]);
  const porSucursal = useMemo(() => gastoPorSucursal(registros, filtros), [registros, filtros]);
  const porSubarea = useMemo(() => presupuestoPorSubarea(registros, filtros, data), [registros, filtros, data]);
  const porMes = useMemo(() => gastoPorMes(registros, filtros), [registros, filtros]);

  const titulo = filtros.area === AREA_GENERAL ? 'Presupuesto general' : `Presupuesto de ${filtros.area}`;
  const subtitulo = `${filtros.subarea ? `Sub-área ${filtros.subarea}` : `Presupuesto anual ${filtros.anio ?? ''}`} · ${dinero(presupuesto)}`;

  return {
    filtros,
    areas,
    anios,
    vistaGeneral: filtros.area === AREA_GENERAL,
    alternar,
    cambiarArea,
    cambiarAnio,
    quitarFiltro,
    buscarTexto,
    kpi: { titulo, subtitulo, gasto, presupuesto, registros: filtrados.length, proyeccion: proyeccionCierre(gasto, filtros) },
    detalle,
    porArea,
    porItem,
    porSucursal,
    porSubarea,
    porMes,
  };
}

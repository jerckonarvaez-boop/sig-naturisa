import { useCallback, useEffect, useMemo, useState } from 'react';
import { ahorroPorMes, ahorroPorParte, aniosDisponibles, filtrarPorAnio, resumir, sugerenciasDe } from '../logic/ahorro';
import { actualizarReparacion, crearReparacion, eliminarReparacion, listarReparaciones } from '../services/oxigenometros.api';
import type { Reparacion, ReparacionDatos } from '../types';

/** Reparaciones de oxigenómetros: carga, filtro por año, cálculos del ahorro y operaciones. */
export function useReparaciones() {
  const [reparaciones, setReparaciones] = useState<Reparacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** undefined = aún no elegido (se usa el año actual o el más reciente); null = todos los años */
  const [anioElegido, setAnio] = useState<number | null | undefined>(undefined);

  const recargar = useCallback(async () => {
    try {
      setReparaciones(await listarReparaciones());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const lista = useMemo(() => reparaciones ?? [], [reparaciones]);
  const anios = useMemo(() => aniosDisponibles(lista), [lista]);
  const actual = new Date().getFullYear();
  const anio = anioElegido !== undefined ? anioElegido : anios.includes(actual) ? actual : (anios[0] ?? null);

  const delPeriodo = useMemo(() => filtrarPorAnio(lista, anio), [lista, anio]);
  const resumen = useMemo(() => resumir(delPeriodo), [delPeriodo]);
  const porMes = useMemo(() => ahorroPorMes(delPeriodo), [delPeriodo]);
  const porParte = useMemo(() => ahorroPorParte(delPeriodo), [delPeriodo]);
  const sugerencias = useMemo(() => sugerenciasDe(lista), [lista]);

  /** Crea o actualiza y recarga la lista */
  const guardar = async (datos: ReparacionDatos, id?: number) => {
    if (id) await actualizarReparacion(id, datos);
    else await crearReparacion(datos);
    await recargar();
  };

  const eliminar = async (id: number) => {
    await eliminarReparacion(id);
    await recargar();
  };

  return {
    cargando: reparaciones === null && !error,
    error,
    hayDatos: lista.length > 0,
    anios,
    anio,
    setAnio,
    delPeriodo,
    resumen,
    porMes,
    porParte,
    sugerencias,
    guardar,
    eliminar,
  };
}

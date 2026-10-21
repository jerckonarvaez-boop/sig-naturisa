import { useCallback, useEffect, useState } from 'react';
import { listarResultados, listarSitios, obtenerDefinicion } from '../services/monitoreo.api';
import type { PuntoMonitoreo } from '../meta';
import type { DefinicionMonitoreo, Resultado, Sitio } from '../types';

// El catálogo de parámetros no cambia: se pide una sola vez
let definicionPendiente: Promise<DefinicionMonitoreo> | null = null;

/**
 * Datos de monitoreo de agua: catálogo de parámetros, camaroneras y resultados (de un punto, o todos).
 * `recargar` vuelve a pedir camaroneras y resultados tras guardar algo.
 */
export function useMonitoreo(punto?: PuntoMonitoreo) {
  const [definicion, setDefinicion] = useState<DefinicionMonitoreo | null>(null);
  const [sitios, setSitios] = useState<Sitio[] | null>(null);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      definicionPendiente ??= obtenerDefinicion();
      const [d, s, r] = await Promise.all([definicionPendiente, listarSitios(), listarResultados(punto)]);
      setDefinicion(d);
      setSitios(s);
      setResultados(r);
      setError(null);
    } catch (e) {
      definicionPendiente = null;
      setError((e as Error).message);
    }
  }, [punto]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { definicion, sitios, resultados, error, cargando: !error && (!definicion || !sitios || !resultados), recargar };
}

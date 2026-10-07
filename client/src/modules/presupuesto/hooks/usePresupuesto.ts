import { useCallback, useEffect, useState } from 'react';
import { obtenerPresupuesto } from '../services/presupuesto.api';
import type { PresupuestoData } from '../types';

/** Carga los datos del presupuesto desde la API. */
export function usePresupuesto() {
  const [data, setData] = useState<PresupuestoData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      setData(await obtenerPresupuesto());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { data, cargando, error, recargar };
}

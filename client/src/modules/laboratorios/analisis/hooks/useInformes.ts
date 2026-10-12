import { useEffect, useState } from 'react';
import { listarInformes } from '../services/laboratorio.api';
import type { InformeResumen, SeccionId } from '../types';

/** Informes de una sección (null mientras carga) */
export function useInformes(seccion: SeccionId) {
  const [informes, setInformes] = useState<InformeResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setInformes(null);
    listarInformes(seccion)
      .then((l) => vigente && setInformes(l))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [seccion]);

  return { informes, error };
}

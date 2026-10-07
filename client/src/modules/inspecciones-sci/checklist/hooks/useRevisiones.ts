import { useEffect, useState } from 'react';
import { listarRevisiones } from '../services/checklist.api';
import type { Revision } from '../types';

/** Historial de revisiones del check list (null mientras carga) */
export function useRevisiones() {
  const [revisiones, setRevisiones] = useState<Revision[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarRevisiones().then(setRevisiones).catch((e: Error) => setError(e.message));
  }, []);

  return { revisiones, error };
}

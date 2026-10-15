import { useEffect, useState } from 'react';
import { obtenerLista } from '@/services/api/listas';

/** Valores vigentes de una lista editable en Configuración (ej. 'oxigenometros.partes'). Vacía mientras carga. */
export function useLista(id: string) {
  const [valores, setValores] = useState<string[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerLista(id)
      .then((l) => vigente && setValores(l.valores))
      .catch(() => undefined)
      .finally(() => vigente && setCargado(true));
    return () => {
      vigente = false;
    };
  }, [id]);

  return { valores, cargado };
}

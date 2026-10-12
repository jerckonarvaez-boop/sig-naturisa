import { useEffect, useState } from 'react';
import { getCatalogo, type CatalogoPresupuesto } from '@/services/api/catalogo';

const VACIO: CatalogoPresupuesto = { centrosCosto: [] };

/**
 * Centros de costo del presupuesto, para las listas validadas de cualquier módulo.
 * Mientras carga (o si falla) devuelve la lista vacía y `cargado: false`.
 */
export function useCatalogo() {
  const [catalogo, setCatalogo] = useState<CatalogoPresupuesto>(VACIO);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let vigente = true;
    getCatalogo()
      .then((c) => vigente && setCatalogo(c))
      .catch(() => undefined)
      .finally(() => vigente && setCargado(true));
    return () => {
      vigente = false;
    };
  }, []);

  return { ...catalogo, cargado };
}

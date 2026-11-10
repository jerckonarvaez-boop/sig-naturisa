import { useEffect, useState } from 'react';
import { obtenerDefinicion } from '../services/laboratorio.api';
import type { DefinicionLaboratorio } from '../types';

// La definición se pide una sola vez y se comparte; si se editan sus listas en Configuración, se vuelve a pedir
let pendiente: Promise<DefinicionLaboratorio> | null = null;

/** Descarta la definición guardada (tras editar géneros o clientes en Configuración) */
export const olvidarDefinicion = () => {
  pendiente = null;
};

/** Definición de las secciones de laboratorio (parámetros, tipos, unidades, referencias) */
export function useDefinicion() {
  const [definicion, setDefinicion] = useState<DefinicionLaboratorio | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    pendiente ??= obtenerDefinicion();
    pendiente
      .then((d) => vigente && setDefinicion(d))
      .catch((e: Error) => {
        pendiente = null;
        if (vigente) setError(e.message);
      });
    return () => {
      vigente = false;
    };
  }, []);

  /** Vuelve a pedir la definición (tras crear un parámetro desde el informe) */
  const recargar = async () => {
    pendiente = obtenerDefinicion();
    const d = await pendiente;
    setDefinicion(d);
    return d;
  };

  return { definicion, error, recargar };
}

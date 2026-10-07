import { useCallback, useEffect, useState } from 'react';
import { actualizarEvento, crearEvento, eliminarEvento, listarEventos } from '../services/eventos.api';
import type { Evento, EventoDatos, TipoEvento } from '../types';

/** Carga los eventos de los tipos indicados y ofrece las operaciones para modificarlos. */
export function useEventos(tipos: TipoEvento[]) {
  const clave = tipos.join(',');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setEventos(await listarEventos(clave ? (clave.split(',') as TipoEvento[]) : []));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [clave]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  /** Crea o actualiza un evento y recarga la lista */
  const guardar = async (datos: EventoDatos, id?: number) => {
    if (id) await actualizarEvento(id, datos);
    else await crearEvento(datos);
    await recargar();
  };

  const eliminar = async (id: number) => {
    await eliminarEvento(id);
    await recargar();
  };

  return { eventos, cargando, error, guardar, eliminar };
}

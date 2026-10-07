import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api/client';
import type { Evento, EventoDatos, TipoEvento } from '../types';

/** Sin tipos devuelve todos los eventos */
export const listarEventos = (tipos: TipoEvento[] = []) =>
  apiGet<Evento[]>(`/eventos${tipos.length ? `?tipo=${tipos.join(',')}` : ''}`);

export const crearEvento = (datos: EventoDatos) => apiPost<Evento>('/eventos', datos);

export const actualizarEvento = (id: number, datos: EventoDatos) => apiPut<Evento>(`/eventos/${id}`, datos);

export const eliminarEvento = (id: number) => apiDelete(`/eventos/${id}`);

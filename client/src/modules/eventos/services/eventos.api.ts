import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api/client';
import type { Evento, EventoDatos, TipoEvento } from '../types';

/** Sin tipos devuelve todos los eventos */
export const listarEventos = (tipos: TipoEvento[] = []) =>
  apiGet<Evento[]>(`/eventos${tipos.length ? `?tipo=${tipos.join(',')}` : ''}`);

export const crearEvento = (datos: EventoDatos) => apiPost<Evento>('/eventos', datos);

export const actualizarEvento = (id: number, datos: EventoDatos) => apiPut<Evento>(`/eventos/${id}`, datos);

export const eliminarEvento = (id: number) => apiDelete(`/eventos/${id}`);

// ---------- avisos por correo ----------
export interface AvisosCalendario {
  /** Correos separados por "; " */
  para: string;
  /** Días de anticipación */
  dias: number;
  /** ¿El servidor tiene una cuenta de correo para enviar? */
  correoConfigurado: boolean;
  remitente: string;
}

export const obtenerAvisos = () => apiGet<AvisosCalendario>('/eventos/avisos');

export const guardarAvisos = (datos: { para: string; dias: number }) => apiPut<AvisosCalendario>('/eventos/avisos', datos);

export const probarAvisos = () => apiPost<{ para: string[] }>('/eventos/avisos/prueba', {});

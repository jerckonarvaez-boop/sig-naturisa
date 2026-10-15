// Listas de valores que el usuario edita en Configuración (/api/configuracion/listas)
import { apiDelete, apiGet, apiPut } from './client';

export interface ListaEditable {
  id: string;
  /** Sección donde se usa (agrupa las listas en la pantalla) */
  seccion: string;
  nombre: string;
  descripcion: string;
  /** Valores de fábrica */
  inicial: string[];
  /** Cada valor debe ser una sola palabra */
  sinEspacios?: boolean;
  /** Valores vigentes */
  valores: string[];
  /** true si se editó (si no, son los de fábrica) */
  editada: boolean;
}

export const obtenerListas = () => apiGet<ListaEditable[]>('/configuracion/listas');

export const obtenerLista = (id: string) => apiGet<{ valores: string[] }>(`/configuracion/listas/${id}`);

export const guardarLista = (id: string, valores: string[]) => apiPut<{ valores: string[] }>(`/configuracion/listas/${id}`, { valores });

export const restaurarLista = (id: string) => apiDelete(`/configuracion/listas/${id}`);

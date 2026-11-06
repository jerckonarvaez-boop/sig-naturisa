// Espacio que ocupa la base de datos (/api/configuracion/almacenamiento)
import { apiGet } from './client';

export interface Almacenamiento {
  /** 'turso' (la web publicada) o 'local' (el borrador en el PC) */
  base: 'turso' | 'local';
  /** Bytes usados y límite del plan */
  usado: number;
  limite: number;
  modulos: { modulo: string; bytes: number }[];
  /** Archivos guardados dentro de la base (PDF, logos, fotos) */
  archivos: { tipo: string; modulo: string; cantidad: number; bytes: number }[];
}

export const obtenerAlmacenamiento = () => apiGet<Almacenamiento>('/configuracion/almacenamiento');

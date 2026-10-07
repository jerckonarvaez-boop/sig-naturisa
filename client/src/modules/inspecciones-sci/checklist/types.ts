// Check list de Buenas Prácticas.
// Deben coincidir con server/src/modules/checklist-bp/checklist-bp.types.ts

export type Respuesta = 'SI' | 'NO' | 'N/A';

/** Fotos de evidencia: solo en requisitos marcados NO */
export const MAX_FOTOS_POR_ITEM = 4;

/** Foto ya guardada (id) o recién tomada, aún sin guardar (data URL JPEG) */
export type Foto = { id: number } | { datos: string };

export interface ItemChecklist {
  id: number;
  seccion: string;
  seccionOrden: number;
  numero: number;
  requerimiento: string;
}

export interface RespuestaItem {
  itemId: number;
  seccion: string;
  numero: number;
  requerimiento: string;
  respuesta: Respuesta | null;
  observacion: string;
  /** Ids de las fotos guardadas */
  fotos: number[];
}

export interface RevisionDatos {
  fecha: string;
  sucursal: string;
  responsable: string;
  observaciones: string;
  respuestas: { itemId: number; respuesta: Respuesta | null; observacion: string; fotos: Foto[] }[];
}

export interface Revision {
  id: number;
  fecha: string;
  sucursal: string;
  responsable: string;
  observaciones: string;
  creadoEn: string;
  actualizadoEn: string;
  respuestas: RespuestaItem[];
}

/** Respuesta mientras se edita en el formulario (fotos guardadas o recién tomadas) */
export interface RespuestaEditable {
  respuesta: Respuesta | null;
  observacion: string;
  /** Evidencia; solo se guarda si la respuesta es NO */
  fotos: Foto[];
}

export const RESPUESTA_VACIA: RespuestaEditable = { respuesta: null, observacion: '', fotos: [] };

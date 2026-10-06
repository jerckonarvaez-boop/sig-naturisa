// Check list de Buenas Prácticas (deben coincidir con client/src/modules/inspecciones-sci/checklist/types.ts)

export const RESPUESTAS = ['SI', 'NO', 'N/A'] as const;
export type Respuesta = (typeof RESPUESTAS)[number];

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
}

export interface RevisionDatos {
  fecha: string;
  sucursal: string;
  responsable: string;
  observaciones: string;
  respuestas: { itemId: number; respuesta: Respuesta | null; observacion: string }[];
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

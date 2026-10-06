// Check list de Buenas Prácticas.
// Deben coincidir con server/src/modules/checklist-bp/checklist-bp.types.ts

export type Respuesta = 'SI' | 'NO' | 'N/A';

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

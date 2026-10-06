// Check list de Buenas Prácticas (deben coincidir con client/src/modules/inspecciones-sci/checklist/types.ts)

export const RESPUESTAS = ['SI', 'NO', 'N/A'] as const;
export type Respuesta = (typeof RESPUESTAS)[number];

/** Fotos de evidencia: solo en requisitos marcados NO */
export const MAX_FOTOS_POR_ITEM = 4;
export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Foto al guardar: una ya existente (id) o una nueva (contenido) */
export type FotoEntrada = { id: number } | { tipo: string; datos: Buffer };

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
  /** Ids de las fotos (se descargan en /api/checklist-bp/fotos/:id) */
  fotos: number[];
}

export interface RevisionDatos {
  fecha: string;
  sucursal: string;
  responsable: string;
  observaciones: string;
  respuestas: { itemId: number; respuesta: Respuesta | null; observacion: string; fotos: FotoEntrada[] }[];
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

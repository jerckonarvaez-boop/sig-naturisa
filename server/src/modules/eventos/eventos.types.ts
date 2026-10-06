// Estructuras del calendario de eventos (deben coincidir con client/src/features/eventos/types.ts)

export const TIPOS_EVENTO = ['auditoria-asc', 'auditoria-bap', 'inspeccion-sci'] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const ESTADOS_EVENTO = ['programado', 'realizado', 'reprogramado', 'cancelado'] as const;
export type EstadoEvento = (typeof ESTADOS_EVENTO)[number];

/** Datos editables de un evento */
export interface EventoDatos {
  tipo: TipoEvento;
  titulo: string;
  fechaInicio: string;
  fechaFin: string | null;
  sucursal: string;
  responsable: string;
  estado: EstadoEvento;
  observaciones: string;
}

export interface Evento extends EventoDatos {
  id: number;
  creadoEn: string;
  actualizadoEn: string;
}

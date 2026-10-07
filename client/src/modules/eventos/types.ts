// Estructuras del calendario de eventos.
// Deben coincidir con server/src/modules/eventos/eventos.types.ts

export type TipoEvento = 'auditoria-asc' | 'auditoria-bap' | 'inspeccion-sci';
export type EstadoEvento = 'programado' | 'realizado' | 'reprogramado' | 'cancelado';

/** Estado que se muestra: añade "vencido" (programado con la fecha ya pasada) */
export type EstadoVisual = EstadoEvento | 'vencido';

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

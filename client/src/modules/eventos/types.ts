// Estructuras del calendario general de eventos.
// Deben coincidir con server/src/modules/eventos/eventos.types.ts

export type TipoEvento =
  | 'auditoria-asc'
  | 'auditoria-bap'
  | 'inspeccion-sci'
  | 'capacitacion'
  | 'mantenimiento'
  | 'vencimiento'
  | 'otro';
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
  /** Avisar por correo antes del evento */
  avisar: boolean;
}

export interface Evento extends EventoDatos {
  id: number;
  /** Cuándo se envió el aviso por correo (null = aún no) */
  avisoEnviadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

// Estructuras del calendario de eventos (deben coincidir con client/src/modules/eventos/types.ts)

export const TIPOS_EVENTO = [
  'auditoria-asc',
  'auditoria-bap',
  'inspeccion-sci',
  'capacitacion',
  'mantenimiento',
  'vencimiento',
  'otro',
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

/** Nombre de cada tipo (para los correos de aviso; la interfaz tiene los suyos en client/.../eventos/config.ts) */
export const NOMBRE_TIPO: Record<TipoEvento, string> = {
  'auditoria-asc': 'Auditoría ASC',
  'auditoria-bap': 'Auditoría BAP',
  'inspeccion-sci': 'Inspección SCI',
  capacitacion: 'Capacitación',
  mantenimiento: 'Mantenimiento / calibración',
  vencimiento: 'Vencimiento / renovación',
  otro: 'Otro',
};

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

// Reparaciones de oxigenómetros (deben coincidir con client/src/modules/laboratorios/oxigenometros/types.ts)

export const ESTADOS_REPARACION = ['reparado', 'en-reparacion', 'no-reparable'] as const;
export type EstadoReparacion = (typeof ESTADOS_REPARACION)[number];

/** Datos editables de una reparación (montos en USD). La reparación no tiene costo: la hace el personal. */
export interface ReparacionDatos {
  fecha: string;
  parte: string;
  cantidad: number;
  equipo: string;
  sucursal: string;
  trabajo: string;
  /** Precio unitario de comprar la parte nueva (el ahorro por unidad reparada) */
  precioNuevo: number;
  estado: EstadoReparacion;
  responsable: string;
  observaciones: string;
}

export interface Reparacion extends ReparacionDatos {
  id: number;
  creadoEn: string;
  actualizadoEn: string;
}

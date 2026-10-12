// Reparaciones de oxigenómetros. Deben coincidir con server/src/modules/oxigenometros/oxigenometros.types.ts

export type EstadoReparacion = 'reparado' | 'en-reparacion' | 'no-reparable';

/** Datos editables de una reparación (montos unitarios en USD) */
export interface ReparacionDatos {
  fecha: string;
  parte: string;
  cantidad: number;
  equipo: string;
  sucursal: string;
  trabajo: string;
  /** Costo de reparar UNA parte (repuestos + mano de obra) */
  costoReparacion: number;
  /** Precio de comprar UNA parte nueva */
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

// Reparaciones de oxigenómetros. Deben coincidir con server/src/modules/oxigenometros/oxigenometros.types.ts

export type EstadoReparacion = 'reparado' | 'en-reparacion' | 'no-reparable';

/** Datos editables de una reparación (USD). Reparar no tiene costo: lo hace el personal de la empresa. */
export interface ReparacionDatos {
  fecha: string;
  parte: string;
  cantidad: number;
  equipo: string;
  sucursal: string;
  trabajo: string;
  /** Precio de comprar UNA parte nueva = ahorro por cada unidad reparada */
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

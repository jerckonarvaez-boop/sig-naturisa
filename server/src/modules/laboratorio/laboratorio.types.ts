// Informes de laboratorio (deben coincidir con client/src/modules/laboratorios/analisis/types.ts)
import type { SeccionId } from './laboratorio.secciones.js';

/** Valor de un parámetro: número, texto o vacío (no analizado) */
export type ValorLab = number | string | null;

export interface MuestraLab {
  nombre: string;
  valores: Record<string, ValorLab>;
}

/** Datos editables de un informe */
export interface InformeDatos {
  seccion: SeccionId;
  tipo: string;
  codigo: string;
  fechaEmision: string;
  fechaMuestra: string;
  sucursal: string;
  matriz: string;
  muestreadoPor: string;
  analisis: string;
  tecnico: string;
  observaciones: string;
  /**
   * Análisis de Agua con químico: claves de los parámetros químicos que lleva el informe, en orden (se quitan o
   * agregan al hacerlo). null = los vigentes en Configuración (informes anteriores a esta opción).
   */
  parametros: string[] | null;
  muestras: MuestraLab[];
}

export interface Informe extends InformeDatos {
  id: number;
  creadoEn: string;
  actualizadoEn: string;
}

/** Fila del listado (sin los valores de las muestras) */
export type InformeResumen = Omit<Informe, 'muestras'> & { muestras: string[] };

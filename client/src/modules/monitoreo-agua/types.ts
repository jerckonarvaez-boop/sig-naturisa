// Monitoreo de agua (deben coincidir con server/src/modules/monitoreo-agua/monitoreo-agua.types.ts)
import type { PuntoMonitoreo } from './meta';

export type TipoSitio = 'camaronera' | 'larvas';

export interface Coordenada {
  punto: string;
  norte: string;
  este: string;
}

/** Textos propios del informe PGC-025 de la camaronera ('' = texto automático). {laboratorio} se reemplaza. */
export interface TextosInforme {
  introduccion: string;
  objetivo: string;
  alcance: string;
  resumen: string;
  conclusion: string;
  tabla: string;
}

/** Camaronera o instalación: datos de la ficha técnica del informe de monitoreo */
export interface SitioDatos {
  numero: number;
  nombre: string;
  tipo: TipoSitio;
  lugar: string;
  entidad: string;
  representante: string;
  ruc: string;
  tipoProyecto: string;
  oficina: string;
  ubicacion: string;
  coordenadasTitulo: string;
  coordenadas: Coordenada[];
  superficie: string;
  activo: boolean;
  /** Título del encabezado bajo "INFORME DE MONITOREO…" ('' = el nombre en mayúsculas) */
  tituloEncabezado: string;
  /** Logos del encabezado (máx. 2); sin logos se usa logoTexto o el de Naturisa */
  logos: number[];
  logoTexto: string;
  textos: TextosInforme;
}

export interface Logo {
  id: number;
  nombre: string;
  tipo: string;
  tamano: number;
}

export interface Sitio extends SitioDatos {
  id: number;
  resultados: number;
}

export interface ValorParametro {
  clave: string;
  valor: string;
}

export interface ResultadoDatos {
  punto: PuntoMonitoreo;
  laboratorio: string;
  codigo: string;
  fechaMuestreo: string;
  fechaEmision: string;
  locacion: string;
  norte: string;
  este: string;
  metodo: string;
  muestreoTercero: boolean;
  sitios: number[];
  valores: ValorParametro[];
  observaciones: string;
}

export interface Resultado extends ResultadoDatos {
  id: number;
  pdf: { nombre: string; tamano: number } | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ParametroMonitoreo {
  clave: string;
  nombre: string;
  unidad: string;
  limite: string;
  max?: number;
  min?: number;
  maxExclusivo?: boolean;
  textoCumple?: string;
}

export interface DefinicionMonitoreo {
  parametros: ParametroMonitoreo[];
  predeterminados: { camaronera: string[]; larvas: string[]; afluente: string[] };
}

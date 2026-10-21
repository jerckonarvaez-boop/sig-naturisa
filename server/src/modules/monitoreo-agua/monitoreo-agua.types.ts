// Monitoreo de agua (deben coincidir con client/src/modules/monitoreo-agua/types.ts)

export const PUNTOS = ['afluente', 'efluente'] as const;
export type Punto = (typeof PUNTOS)[number];

export const TIPOS_SITIO = ['camaronera', 'larvas'] as const;
export type TipoSitio = (typeof TIPOS_SITIO)[number];

export interface Coordenada {
  punto: string;
  norte: string;
  este: string;
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
}

export interface Sitio extends SitioDatos {
  id: number;
  /** Resultados registrados que lo incluyen */
  resultados: number;
}

export interface ValorParametro {
  clave: string;
  /** Tal como lo reporta el laboratorio: "11,04", "<0,27", "Ausencia" */
  valor: string;
}

export interface ResultadoDatos {
  punto: Punto;
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
  /** PDF original adjunto (el contenido se descarga aparte) */
  pdf: { nombre: string; tamano: number } | null;
  creadoEn: string;
  actualizadoEn: string;
}

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

/** Textos propios del informe PGC-025 de la camaronera ('' = texto automático). {laboratorio} se reemplaza. */
export interface TextosInforme {
  /** Sujeto de la introducción: "La empresa Naturisa S.A. – Isla Josefina" */
  introduccion: string;
  objetivo: string;
  alcance: string;
  /** Párrafo antes de la tabla: "Los análisis de agua del Efluente de … fueron realizados por Laboratorio {laboratorio}…" */
  resumen: string;
  /** Conclusión: "De acuerdo con los resultados … por el Laboratorio {laboratorio} … se observa que no existe un impacto…" */
  conclusion: string;
  /** Título de la tabla 1 (sin "Tabla 1."): "Resultados Análisis Efluentes - Camaronera Naturisa S.A - Isla Josefina" */
  tabla: string;
}

export const CAMPOS_TEXTOS: (keyof TextosInforme)[] = ['introduccion', 'objetivo', 'alcance', 'resumen', 'conclusion', 'tabla'];

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
  /** Encabezado del informe: título bajo "INFORME DE MONITOREO…" */
  tituloEncabezado: string;
  /** Logos del encabezado (ids de monitoreo_logo, máx. 2); sin logos se usa logoTexto o el de Naturisa */
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

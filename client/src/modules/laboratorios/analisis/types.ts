// Informes de laboratorio (agua, suelo, patologías en fresco).
// Deben coincidir con server/src/modules/laboratorio/laboratorio.types.ts y laboratorio.secciones.ts.
// La definición de cada sección (parámetros, unidades, referencias) la envía el servidor.

export type SeccionId = 'agua' | 'suelo' | 'patologia';

export interface CampoLab {
  clave: string;
  etiqueta: string;
  tipo: 'numero' | 'texto';
  unidad?: string;
  grupo: string;
  soloTipos?: string[];
  min?: number;
  max?: number;
  factorSalinidad?: number;
  escala?: 'patologia';
  /** Texto que se elige de esta lista (uno o varios, separados por espacio) en vez de escribirse */
  opciones?: string[];
  /** Se muestra en la misma fila que este campo (a su derecha) */
  junto?: string;
  /** Parámetros químicos editables: nombre corto y fórmula (encabezado del informe impreso) */
  nombre?: string;
  formula?: string;
  /** Quitado en Configuración: solo se muestra en los informes que ya tienen su valor */
  oculto?: boolean;
}

export interface GrupoLab {
  id: string;
  nombre: string;
  soloTipos?: string[];
  nota?: string;
}

export interface TipoInforme {
  id: string;
  nombre: string;
  /** Nombre corto para la lista de informes (secciones combinables) */
  corto?: string;
  unaMuestra?: boolean;
}

export interface SeccionLab {
  id: SeccionId;
  nombre: string;
  prefijo: string;
  etiquetaMuestra: string;
  etiquetaFechaMuestra: string;
  matrices: string[];
  tipos: TipoInforme[];
  /** Los tipos son análisis que se combinan: el informe lleva uno o varios, guardados como "a+b+c" */
  combinable?: boolean;
  grupos: GrupoLab[];
  campos: CampoLab[];
  metodos: string[];
}

export interface DefinicionLaboratorio {
  secciones: Record<SeccionId, SeccionLab>;
  /** Clientes externos que se suman a los centros de costo en "Identificación de la muestra" */
  clientes: string[];
}

export type ValorLab = number | string | null;

export interface MuestraLab {
  nombre: string;
  valores: Record<string, ValorLab>;
}

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
  /** Claves de los parámetros químicos que lleva el informe, en orden; null = los vigentes en Configuración */
  parametros: string[] | null;
  muestras: MuestraLab[];
}

export interface Informe extends InformeDatos {
  id: number;
  creadoEn: string;
  actualizadoEn: string;
}

export type InformeResumen = Omit<Informe, 'muestras'> & { muestras: string[] };

/** Parámetro del análisis químico de agua, editable en Configuración */
export interface ParametroQuimico {
  /** Sin clave: parámetro nuevo (el servidor le asigna una) */
  clave?: string;
  nombre: string;
  /** Encabezado de su columna en el informe impreso, ej. N-NH₄ */
  formula: string;
  unidad: string;
  min?: number;
  max?: number;
  /** Referencia = factor × salinidad (reemplaza al rango) */
  factorSalinidad?: number;
  /** Quitado: solo se muestra en los informes que ya tienen su valor */
  oculto?: boolean;
}

export interface ParametrosQuimicos {
  parametros: ParametroQuimico[];
  /** true si se editaron (si no, son los de fábrica) */
  editados: boolean;
  iniciales: ParametroQuimico[];
}

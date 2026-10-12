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
  muestras: MuestraLab[];
}

export interface Informe extends InformeDatos {
  id: number;
  creadoEn: string;
  actualizadoEn: string;
}

export type InformeResumen = Omit<Informe, 'muestras'> & { muestras: string[] };

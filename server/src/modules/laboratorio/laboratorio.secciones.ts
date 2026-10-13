/**
 * Definición de los informes de laboratorio (única fuente de verdad: la interfaz la pide por la API
 * y dibuja los formularios a partir de aquí). Para agregar un parámetro o una sección nueva basta con
 * editar este archivo; los valores se guardan como JSON en lab_muestra.valores.
 */

export type SeccionId = 'agua' | 'suelo' | 'patologia';

export interface CampoLab {
  clave: string;
  etiqueta: string;
  tipo: 'numero' | 'texto';
  unidad?: string;
  grupo: string;
  /** Solo aparece en estos tipos de informe (si no se indica, en todos) */
  soloTipos?: string[];
  /** Rango de referencia: fuera de él la interfaz lo marca */
  min?: number;
  max?: number;
  /** Valor de referencia = factor × salinidad (Ca, Mg, K) */
  factorSalinidad?: number;
  /** Escala de grados de patología (0 = ausencia … 4 = muy alto) */
  escala?: 'patologia';
}

export interface GrupoLab {
  id: string;
  nombre: string;
  soloTipos?: string[];
  /** Texto de referencia o método que se muestra bajo el grupo */
  nota?: string;
}

export interface TipoInforme {
  id: string;
  nombre: string;
  /** El informe tiene exactamente una muestra */
  unaMuestra?: boolean;
}

export interface SeccionLab {
  id: SeccionId;
  nombre: string;
  /** Prefijo del código del informe, ej. AA → AA-2026-008 */
  prefijo: string;
  etiquetaMuestra: string;
  etiquetaFechaMuestra: string;
  matrices: string[];
  tipos: TipoInforme[];
  grupos: GrupoLab[];
  campos: CampoLab[];
  metodos: string[];
}

const COMPLETO = ['completo'];
/** Tipos de agua con todos los químicos (con o sin bacteriología) */
const TODOS_QUIMICOS = ['completo', 'quimicos'];
const CON_BACTERIOLOGIA = ['una-bact', 'varias-bact'];

const agua: SeccionLab = {
  id: 'agua',
  nombre: 'Análisis de Agua',
  prefijo: 'AA',
  etiquetaMuestra: 'Muestra',
  etiquetaFechaMuestra: 'Fecha de análisis',
  matrices: ['Agua'],
  tipos: [
    { id: 'completo', nombre: 'Agua con químicos y bacteriología' },
    { id: 'quimicos', nombre: 'Agua con todos los químicos' },
    { id: 'basico', nombre: 'Análisis de agua básico' },
  ],
  grupos: [
    { id: 'fitoplancton', nombre: 'Análisis de fitoplancton', nota: 'Conteo directo al microscopio en cámara New Bauer · cel/ml (000)' },
    { id: 'quimica', nombre: 'Análisis químico', nota: 'Espectrofotometría (YSI 9300)' },
    {
      id: 'bacteriologia',
      nombre: 'Análisis bacteriológico',
      soloTipos: COMPLETO,
      nota: 'Siembra directa del agua en medio sólido TCBS · Vibrios: rango óptimo 500 – 1000 UFC/ml',
    },
  ],
  campos: [
    { clave: 'diatomeas', etiqueta: 'Diatomeas', tipo: 'numero', grupo: 'fitoplancton' },
    { clave: 'cianofitas', etiqueta: 'Cianofitas', tipo: 'numero', grupo: 'fitoplancton' },
    { clave: 'clorofitas', etiqueta: 'Clorofitas', tipo: 'numero', grupo: 'fitoplancton' },
    { clave: 'dinoflagelados', etiqueta: 'Dinoflagelados', tipo: 'numero', grupo: 'fitoplancton' },
    { clave: 'otros_fito', etiqueta: 'Otros', tipo: 'numero', grupo: 'fitoplancton' },
    { clave: 'generos_diatomeas', etiqueta: 'Géneros de diatomeas', tipo: 'texto', grupo: 'fitoplancton' },
    { clave: 'generos_cianofitas', etiqueta: 'Géneros de cianofitas', tipo: 'texto', grupo: 'fitoplancton' },
    { clave: 'generos_clorofitas', etiqueta: 'Géneros de clorofitas', tipo: 'texto', grupo: 'fitoplancton' },
    { clave: 'generos_dinoflagelados', etiqueta: 'Géneros de dinoflagelados', tipo: 'texto', grupo: 'fitoplancton' },
    { clave: 'generos_otros', etiqueta: 'Géneros de otros', tipo: 'texto', grupo: 'fitoplancton' },
    { clave: 'salinidad', etiqueta: 'Salinidad', tipo: 'numero', unidad: 'ppt', grupo: 'quimica' },
    { clave: 'ph', etiqueta: 'pH', tipo: 'numero', grupo: 'quimica', min: 7, max: 8 },
    { clave: 'alcalinidad', etiqueta: 'Alcalinidad', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', min: 100, max: 140 },
    { clave: 'fosfato', etiqueta: 'Fosfato PO₄³⁻', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: TODOS_QUIMICOS, min: 0.6, max: 1.5 },
    { clave: 'amonio', etiqueta: 'Amonio N-NH₄', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: TODOS_QUIMICOS, min: 0.1, max: 1 },
    { clave: 'nitrito', etiqueta: 'Nitrito NO₂⁻', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: TODOS_QUIMICOS },
    { clave: 'nitrato', etiqueta: 'Nitrato NO₃⁻', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: TODOS_QUIMICOS },
    { clave: 'calcio', etiqueta: 'Calcio Ca²⁺', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: TODOS_QUIMICOS, factorSalinidad: 11.6 },
    { clave: 'magnesio', etiqueta: 'Magnesio Mg²⁺', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: TODOS_QUIMICOS, factorSalinidad: 39.1 },
    { clave: 'potasio', etiqueta: 'Potasio K⁺', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: TODOS_QUIMICOS, factorSalinidad: 10.7 },
    { clave: 'vibrios_amarillas', etiqueta: 'Vibrios: colonias amarillas', tipo: 'numero', unidad: 'UFC/ml', grupo: 'bacteriologia', soloTipos: COMPLETO },
    { clave: 'vibrios_verdes', etiqueta: 'Vibrios: colonias verdes', tipo: 'numero', unidad: 'UFC/ml', grupo: 'bacteriologia', soloTipos: COMPLETO },
  ],
  metodos: [
    'Análisis de fitoplancton: conteo directo al microscopio en cámara New Bauer.',
    'Análisis químico: espectrofotometría (YSI 9300).',
    'Análisis bacteriológico: siembra directa del agua en medio sólido TCBS.',
  ],
};

const suelo: SeccionLab = {
  id: 'suelo',
  nombre: 'Análisis de Suelo',
  prefijo: 'AS',
  etiquetaMuestra: 'Piscina',
  etiquetaFechaMuestra: 'Fecha de muestreo',
  matrices: ['Suelo de piscinas'],
  tipos: [{ id: 'materia-organica', nombre: 'Análisis de materia orgánica' }],
  grupos: [{ id: 'suelo', nombre: 'Análisis de suelo' }],
  campos: [
    { clave: 'humedad', etiqueta: 'Humedad', tipo: 'numero', unidad: '%', grupo: 'suelo' },
    { clave: 'ph_seco', etiqueta: 'pH seco', tipo: 'numero', grupo: 'suelo' },
    { clave: 'materia_organica', etiqueta: 'Materia orgánica', tipo: 'numero', unidad: '%', grupo: 'suelo' },
  ],
  metodos: [],
};

const grado = (clave: string, etiqueta: string): CampoLab => ({ clave, etiqueta, tipo: 'numero', grupo: 'fresco', escala: 'patologia', min: 0, max: 4 });

const patologia: SeccionLab = {
  id: 'patologia',
  nombre: 'Patologías en fresco',
  prefijo: 'AF',
  etiquetaMuestra: 'Muestra',
  etiquetaFechaMuestra: 'Fecha de recepción',
  matrices: ['Camarones', 'Camarones juveniles', 'Camarones adultos'],
  tipos: [
    { id: 'una-bact', nombre: 'Patología, una sola muestra, con bacteriología', unaMuestra: true },
    { id: 'una', nombre: 'Patología, una sola muestra', unaMuestra: true },
    { id: 'varias', nombre: 'Patología, varias muestras, sin bacteriología' },
    { id: 'varias-bact', nombre: 'Patología, varias muestras, con bacteriología' },
  ],
  grupos: [
    {
      id: 'bacteriologia',
      nombre: 'Bacteriología',
      soloTipos: CON_BACTERIOLOGIA,
      nota: 'Siembra en medio sólido TCBS (Vibrios sp) de macerado de hepatopáncreas y estómago · UFC/g',
    },
    {
      id: 'fresco',
      nombre: 'Análisis en fresco',
      nota: 'Grado: 0 = ausencia · 0,1–0,9 = bajo · 1,0–1,9 = medio · 2,0–2,9 = alto · 3,0–4,0 = muy alto',
    },
  ],
  campos: [
    { clave: 'hp_amarillas', etiqueta: 'Hepatopáncreas: colonias amarillas', tipo: 'numero', unidad: 'UFC/g', grupo: 'bacteriologia', soloTipos: CON_BACTERIOLOGIA },
    { clave: 'hp_verdes', etiqueta: 'Hepatopáncreas: colonias verdes', tipo: 'numero', unidad: 'UFC/g', grupo: 'bacteriologia', soloTipos: CON_BACTERIOLOGIA },
    { clave: 'est_amarillas', etiqueta: 'Estómago: colonias amarillas', tipo: 'numero', unidad: 'UFC/g', grupo: 'bacteriologia', soloTipos: CON_BACTERIOLOGIA },
    { clave: 'est_verdes', etiqueta: 'Estómago: colonias verdes', tipo: 'numero', unidad: 'UFC/g', grupo: 'bacteriologia', soloTipos: CON_BACTERIOLOGIA },
    { clave: 'hem_amarillas', etiqueta: 'Hemolinfa: colonias amarillas', tipo: 'numero', unidad: 'UFC/ml', grupo: 'bacteriologia', soloTipos: CON_BACTERIOLOGIA },
    { clave: 'hem_verdes', etiqueta: 'Hemolinfa: colonias verdes', tipo: 'numero', unidad: 'UFC/ml', grupo: 'bacteriologia', soloTipos: CON_BACTERIOLOGIA },
    grado('deformidad_tubulos', 'Deformidad en túbulos del hepatopáncreas'),
    grado('lipidos', 'Lípidos en hepatopáncreas'),
    grado('baculovirus', 'Hepatopáncreas: baculovirus'),
    grado('vermiformes_hp', 'Cuerpos vermiformes en hepatopáncreas'),
    grado('epibiontes', 'Epibiontes en branquias y apéndices'),
    grado('necrosis_branquial', 'Necrosis branquial'),
    grado('gregarinas', 'Tracto digestivo: gregarinas'),
    grado('nematodos', 'Tracto digestivo: nematodos'),
    grado('vermiformes_intestino', 'Cuerpos vermiformes en intestino'),
    grado('diatomeas_td', 'Tracto digestivo: diatomeas'),
    grado('cianofitas_td', 'Tracto digestivo: cianofitas'),
    { clave: 'otros', etiqueta: 'Otros', tipo: 'texto', grupo: 'fresco' },
    { clave: 'apariencia', etiqueta: 'Apariencia externa', tipo: 'texto', grupo: 'fresco' },
    { clave: 'notas', etiqueta: 'Observaciones de la muestra', tipo: 'texto', grupo: 'fresco' },
  ],
  metodos: [
    'Patología en fresco: observación directa al microscopio de montajes en fresco de muestras de camarón.',
    'Bacteriología: siembra en medio sólido TCBS de macerado de hepatopáncreas y estómago.',
  ],
};

export const SECCIONES: Record<SeccionId, SeccionLab> = { agua, suelo, patologia };

/** Laboratorios externos o clientes que no están en el presupuesto (se suman a los centros de costo) */
export const CLIENTES_LABORATORIO = ['Kamaclusa', 'Pesjoya'];

/** Campos que aplican a un tipo de informe */
export const camposDelTipo = (seccion: SeccionLab, tipo: string) =>
  seccion.campos.filter((c) => !c.soloTipos || c.soloTipos.includes(tipo));

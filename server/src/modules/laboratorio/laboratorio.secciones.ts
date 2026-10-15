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
  /** Rango de referencia: fuera de él el formulario y el informe impreso lo marcan (▲ alto en rojo / ▼ bajo en azul) */
  min?: number;
  max?: number;
  /** Valor de referencia = factor × salinidad (Ca, Mg, K) */
  factorSalinidad?: number;
  /** Escala de grados de patología (0 = ausencia … 4 = muy alto) */
  escala?: 'patologia';
  /** Texto que se elige de esta lista (uno o varios, guardados separados por espacio) en vez de escribirse */
  opciones?: string[];
  /** Se muestra en la misma fila que este campo (a su derecha), no como fila propia */
  junto?: string;
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
  /** Nombre corto para la lista de informes (secciones combinables) */
  corto?: string;
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
  /** Los tipos son análisis que se combinan: el informe lleva uno o varios, guardados como "a+b+c" */
  combinable?: boolean;
  grupos: GrupoLab[];
  campos: CampoLab[];
  metodos: string[];
}

// Análisis de agua: se combinan una, dos o las tres tablas del informe
const FITOPLANCTON = ['fitoplancton'];
const QUIMICO = ['quimico'];
const BACTERIOLOGICO = ['bacteriologia'];
/** Salinidad, pH y alcalinidad: van en la tabla química o, si no hay análisis químico, junto al fitoplancton */
const BASICOS = ['fitoplancton', 'quimico'];
// Patologías: análisis en fresco y/o bacteriología (una o varias muestras, según cuántas se agreguen)
const FRESCO = ['fresco'];

/**
 * Géneros de un grupo de fitoplancton: se eligen (uno o varios) junto a su conteo. Lista tomada de los informes
 * AA en Excel; para agregar un género basta con sumarlo aquí.
 */
const generos = (clave: string, etiqueta: string, junto: string, opciones: string[]): CampoLab => ({
  clave,
  etiqueta,
  tipo: 'texto',
  grupo: 'fitoplancton',
  soloTipos: FITOPLANCTON,
  opciones,
  junto,
});

const agua: SeccionLab = {
  id: 'agua',
  nombre: 'Análisis de Agua',
  prefijo: 'AA',
  etiquetaMuestra: 'Muestra',
  etiquetaFechaMuestra: 'Fecha de análisis',
  matrices: ['Agua'],
  tipos: [
    { id: 'fitoplancton', nombre: 'Análisis de Fitoplancton', corto: 'Fitoplancton' },
    { id: 'quimico', nombre: 'Análisis Químico de Agua', corto: 'Químico' },
    { id: 'bacteriologia', nombre: 'Análisis Bacteriológico de Agua', corto: 'Bacteriológico' },
  ],
  combinable: true,
  grupos: [
    { id: 'fitoplancton', nombre: 'Análisis de fitoplancton', soloTipos: FITOPLANCTON, nota: 'Conteo directo al microscopio en cámara New Bauer · cel/ml (000)' },
    { id: 'basicos', nombre: 'Salinidad, pH y alcalinidad', soloTipos: BASICOS },
    { id: 'quimica', nombre: 'Análisis químico', soloTipos: QUIMICO, nota: 'Espectrofotometría (YSI 9300)' },
    {
      id: 'bacteriologia',
      nombre: 'Análisis bacteriológico',
      soloTipos: BACTERIOLOGICO,
      nota: 'Siembra directa del agua en medio sólido TCBS · Vibrios: rango óptimo 500 – 1000 UFC/ml',
    },
  ],
  campos: [
    { clave: 'diatomeas', etiqueta: 'Diatomeas', tipo: 'numero', grupo: 'fitoplancton', soloTipos: FITOPLANCTON },
    { clave: 'cianofitas', etiqueta: 'Cianofitas', tipo: 'numero', grupo: 'fitoplancton', soloTipos: FITOPLANCTON },
    { clave: 'clorofitas', etiqueta: 'Clorofitas', tipo: 'numero', grupo: 'fitoplancton', soloTipos: FITOPLANCTON },
    { clave: 'dinoflagelados', etiqueta: 'Dinoflagelados', tipo: 'numero', grupo: 'fitoplancton', soloTipos: FITOPLANCTON },
    { clave: 'otros_fito', etiqueta: 'Otros', tipo: 'numero', grupo: 'fitoplancton', soloTipos: FITOPLANCTON },
    generos('generos_diatomeas', 'Géneros de diatomeas', 'diatomeas', ['Nitzschia', 'Crisofitas', 'Thalassiosira', 'Skeletonema']),
    generos('generos_cianofitas', 'Géneros de cianofitas', 'cianofitas', ['Oscillatoria', 'Raphidiopsis']),
    generos('generos_clorofitas', 'Géneros de clorofitas', 'clorofitas', ['Euglena', 'Trachelomonas']),
    generos('generos_dinoflagelados', 'Géneros de dinoflagelados', 'dinoflagelados', ['Peridiniopsis']),
    generos('generos_otros', 'Géneros de otros', 'otros_fito', ['Heterosigma', 'Chatonella']),
    { clave: 'salinidad', etiqueta: 'Salinidad', tipo: 'numero', unidad: 'ppt', grupo: 'basicos', soloTipos: BASICOS },
    { clave: 'ph', etiqueta: 'pH', tipo: 'numero', grupo: 'basicos', soloTipos: BASICOS, min: 7, max: 8 },
    { clave: 'alcalinidad', etiqueta: 'Alcalinidad', tipo: 'numero', unidad: 'mg/L', grupo: 'basicos', soloTipos: BASICOS, min: 100, max: 140 },
    { clave: 'fosfato', etiqueta: 'Fosfato PO₄³⁻', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: QUIMICO, min: 0.6, max: 1.5 },
    { clave: 'amonio', etiqueta: 'Amonio N-NH₄', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: QUIMICO, min: 0.1, max: 1 },
    { clave: 'nitrito', etiqueta: 'Nitrito NO₂⁻', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: QUIMICO },
    { clave: 'nitrato', etiqueta: 'Nitrato NO₃⁻', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: QUIMICO },
    { clave: 'calcio', etiqueta: 'Calcio Ca²⁺', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: QUIMICO, factorSalinidad: 11.6 },
    { clave: 'magnesio', etiqueta: 'Magnesio Mg²⁺', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: QUIMICO, factorSalinidad: 39.1 },
    { clave: 'potasio', etiqueta: 'Potasio K⁺', tipo: 'numero', unidad: 'mg/L', grupo: 'quimica', soloTipos: QUIMICO, factorSalinidad: 10.7 },
    { clave: 'vibrios_amarillas', etiqueta: 'Vibrios: colonias amarillas', tipo: 'numero', unidad: 'UFC/ml', grupo: 'bacteriologia', soloTipos: BACTERIOLOGICO, max: 1000 },
    { clave: 'vibrios_verdes', etiqueta: 'Vibrios: colonias verdes', tipo: 'numero', unidad: 'UFC/ml', grupo: 'bacteriologia', soloTipos: BACTERIOLOGICO, max: 1000 },
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

const grado = (clave: string, etiqueta: string): CampoLab => ({
  clave,
  etiqueta,
  tipo: 'numero',
  grupo: 'fresco',
  soloTipos: FRESCO,
  escala: 'patologia',
  min: 0,
  max: 4,
});

const patologia: SeccionLab = {
  id: 'patologia',
  nombre: 'Patologías en fresco',
  prefijo: 'AF',
  etiquetaMuestra: 'Muestra',
  etiquetaFechaMuestra: 'Fecha de recepción',
  matrices: ['Camarones', 'Camarones juveniles', 'Camarones adultos'],
  tipos: [
    { id: 'fresco', nombre: 'Patología en fresco', corto: 'Patología' },
    { id: 'bacteriologia', nombre: 'Bacteriología', corto: 'Bacteriología' },
  ],
  combinable: true,
  grupos: [
    {
      id: 'bacteriologia',
      nombre: 'Bacteriología',
      soloTipos: BACTERIOLOGICO,
      nota: 'Siembra en medio sólido TCBS (Vibrios sp) de macerado de hepatopáncreas y estómago · UFC/g',
    },
    {
      id: 'fresco',
      nombre: 'Análisis en fresco',
      soloTipos: FRESCO,
      nota: 'Grado: 0 = ausencia · 0,1–0,9 = bajo · 1,0–1,9 = medio · 2,0–2,9 = alto · 3,0–4,0 = muy alto',
    },
  ],
  campos: [
    { clave: 'hp_amarillas', etiqueta: 'Hepatopáncreas: colonias amarillas', tipo: 'numero', unidad: 'UFC/g', grupo: 'bacteriologia', soloTipos: BACTERIOLOGICO },
    { clave: 'hp_verdes', etiqueta: 'Hepatopáncreas: colonias verdes', tipo: 'numero', unidad: 'UFC/g', grupo: 'bacteriologia', soloTipos: BACTERIOLOGICO },
    { clave: 'est_amarillas', etiqueta: 'Estómago: colonias amarillas', tipo: 'numero', unidad: 'UFC/g', grupo: 'bacteriologia', soloTipos: BACTERIOLOGICO },
    { clave: 'est_verdes', etiqueta: 'Estómago: colonias verdes', tipo: 'numero', unidad: 'UFC/g', grupo: 'bacteriologia', soloTipos: BACTERIOLOGICO },
    { clave: 'hem_amarillas', etiqueta: 'Hemolinfa: colonias amarillas', tipo: 'numero', unidad: 'UFC/ml', grupo: 'bacteriologia', soloTipos: BACTERIOLOGICO },
    { clave: 'hem_verdes', etiqueta: 'Hemolinfa: colonias verdes', tipo: 'numero', unidad: 'UFC/ml', grupo: 'bacteriologia', soloTipos: BACTERIOLOGICO },
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
    { clave: 'otros', etiqueta: 'Otros', tipo: 'texto', grupo: 'fresco', soloTipos: FRESCO },
    { clave: 'apariencia', etiqueta: 'Apariencia externa', tipo: 'texto', grupo: 'fresco', soloTipos: FRESCO },
    { clave: 'notas', etiqueta: 'Observaciones de la muestra', tipo: 'texto', grupo: 'fresco', soloTipos: FRESCO },
  ],
  metodos: [
    'Patología en fresco: observación directa al microscopio de montajes en fresco de muestras de camarón.',
    'Bacteriología: siembra en medio sólido TCBS de macerado de hepatopáncreas y estómago.',
  ],
};

export const SECCIONES: Record<SeccionId, SeccionLab> = { agua, suelo, patologia };

/** Laboratorios externos o clientes que no están en el presupuesto (se suman a los centros de costo) */
export const CLIENTES_LABORATORIO = ['Kamaclusa', 'Pesjoya'];

/** Análisis que forman el tipo guardado: "fitoplancton+quimico" → ['fitoplancton', 'quimico'] */
export const partesDelTipo = (tipo: string) => tipo.split('+');

/** Tipos que forman el valor recibido, en el orden de la definición; null si no es válido */
export function tiposDelInforme(seccion: SeccionLab, tipo: unknown): TipoInforme[] | null {
  if (typeof tipo !== 'string') return null;
  const partes = partesDelTipo(tipo);
  if (partes.length > 1 && !seccion.combinable) return null;
  if (new Set(partes).size !== partes.length) return null;
  const tipos = seccion.tipos.filter((t) => partes.includes(t.id));
  return tipos.length === partes.length ? tipos : null;
}

/** Campos que aplican a un tipo de informe (en las secciones combinables, los de cualquiera de sus análisis) */
export function camposDelTipo(seccion: SeccionLab, tipo: string) {
  const partes = partesDelTipo(tipo);
  return seccion.campos.filter((c) => !c.soloTipos || c.soloTipos.some((t) => partes.includes(t)));
}

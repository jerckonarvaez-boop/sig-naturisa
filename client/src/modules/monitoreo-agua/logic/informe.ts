// Contenido del informe PGC-025 que comparten la vista en pantalla (y su PDF) y el archivo Word.
import { urlLogo } from '../services/monitoreo.api';
import type { CampoEdicion, DefinicionMonitoreo, EdicionInforme, ParametroMonitoreo, Resultado, Sitio } from '../types';
import { evaluar, parametroDe, semestre, type Evaluacion } from './monitoreo';
import { textosDelInforme } from './plantilla';

/** Logo de Naturisa: el que llevan los informes de las camaroneras que no tienen otro */
const LOGO_NATURISA = '/logo-naturisa-color.png';

export const DEFINICIONES: [string, string][] = [
  ['Afluente:', 'es el agua u otro líquido que ingresa a un cuerpo de agua receptor, reservorio, planta de tratamiento o proceso de tratamiento.'],
  ['Efluente:', 'Descarga o vertido líquido proveniente de un proceso productivo o de una actividad determinada.'],
  ['Impacto ambiental:', 'cambio o consecuencia en el ambiente que resulta de una acción específica o proyecto.'],
  ['Muestreo:', 'proceso de tomar una porción representativa, de un volumen de agua u otro elemento, o una población, para el análisis de varias características definidas.'],
  ['Parámetro,', 'componente o característica: es una variable o propiedad física, química, biológica, combinación de las anteriores, elemento o sustancia que sirve para caracterizar la calidad del recurso agua o de las descargas.'],
  ['Punto de muestreo:', 'lugar donde se toman las muestras.'],
];

/**
 * Cómo se escribe cada parámetro en la tabla del informe, igual que en los Word: las camaroneras usan nombres con
 * sigla (DBO5, SST) y los laboratorios de larvas los nombres del informe de ELICROM en mayúsculas.
 */
const EN_TABLA: Record<'camaronera' | 'larvas', Record<string, [string, string, string]>> = {
  camaronera: {
    dbo5: ['Demanda Bioquímica de Oxígeno (DBO5)', 'mg/l', '200'],
    sulfuros: ['Sulfuros', 'mg/l', '0,5'],
    sst: ['Sólidos Suspendidos Totales (SST)', 'mg/l', '250'],
    ph: ['Potencial de Hidrógeno', 'U de pH', '6-9'],
  },
  larvas: {
    coliformes_fecales: ['COLIFORMES FECALES', 'NMP/100 mL', '2000'],
    aceites_grasas: ['ACEITES Y GRASAS', 'mg/L', '30,0'],
    dbo5: ['DEMANDA BIOQUÍMICA DE OXÍGENO', 'mg/L', '200,0'],
    dqo: ['DEMANDA QUÍMICA DE OXÍGENO', 'mg/L', '400,0'],
    tph: ['HIDROCARBUROS TOTALES DE PETRÓLEO', 'mg/L', '20,0'],
    tensoactivos: ['TENSOACTIVOS', 'mg/L', '0,5'],
    cloro_total: ['CLORO TOTAL', 'mg/L', '---'],
    nitrogeno_total: ['NITROGENO TOTAL', 'mg/L', '40,0'],
    oxigeno_disuelto: ['OXÍGENO DISUELTO', 'mg/L', '---'],
    ph: ['pH', 'U pH', '6-9'],
    sulfuros: ['SULFUROS', 'mg/L', '0,5'],
    material_flotante: ['MATERIAL FLOTANTE', '---', 'AUSENCIA'],
    sst: ['SÓLIDOS SUSPENDIDOS TOTALES', 'mg/L', '250,0'],
    temperatura: ['TEMPERATURA', 'ºC', '<35'],
  },
};

export interface FilaResultado {
  clave: string;
  valor: string;
  nombre: string;
  unidad: string;
  limite: string;
  estado: Evaluacion;
}

/** Los dos párrafos de la Introducción */
function introduccion(tx: ReturnType<typeof textosDelInforme>, ordinal: string) {
  return [
    `${tx.introduccion}, consciente de la importancia y el cuidado al medio ambiente y cumpliendo con la normativa ambiental vigente ha realizado su ${ordinal} análisis anual de agua del efluente.`,
    `En este informe se detalla los resultados obtenidos en los análisis efectuados por la empresa Laboratorios ${tx.laboratorio} y a su vez se realiza la comparación de los parámetros con la norma ambiental (Acuerdo Ministerial 097a – Anexo1. Recurso Agua), con la finalidad de demostrar que las actividades productivas de la compañía no afectan al medio ambiente.`,
  ];
}

/** Textos que se pueden corregir a mano en cada informe, con su nombre en el editor */
export const CAMPOS_EDITABLES: { campo: CampoEdicion; etiqueta: string }[] = [
  { campo: 'intro1', etiqueta: '1. Introducción · primer párrafo' },
  { campo: 'intro2', etiqueta: '1. Introducción · segundo párrafo' },
  { campo: 'objetivo', etiqueta: '3. Objetivo' },
  { campo: 'alcance', etiqueta: '4. Alcance' },
  { campo: 'resumen', etiqueta: '6. Resumen de los resultados' },
  { campo: 'tabla', etiqueta: 'Título de la Tabla 1' },
  { campo: 'conclusion', etiqueta: 'Conclusión' },
  { campo: 'anexo', etiqueta: '7. Anexos' },
];

/**
 * Filas de la tabla de resultados y textos del informe: los corregidos a mano para este informe (edicion) o, si no,
 * los de la ficha de la camaronera o los automáticos (automaticos).
 */
export function datosDelInforme(sitio: Sitio, resultado: Resultado, definicion: DefinicionMonitoreo, edicion?: EdicionInforme) {
  const filas: FilaResultado[] = resultado.valores
    .filter((v) => v.valor.trim())
    .map((v) => {
      const p = parametroDe(definicion, v.clave);
      const [nombre, unidad, limite] = EN_TABLA[sitio.tipo][v.clave] ?? [p?.nombre ?? v.clave, p?.unidad ?? '', p?.limite ?? ''];
      return { clave: v.clave, valor: v.valor, nombre, unidad, limite, estado: evaluar(p, v.valor) };
    });
  const excedidos = filas.filter((f) => f.estado === 'no-cumple').map((f) => parametroDe(definicion, f.clave) as ParametroMonitoreo);
  const tx = textosDelInforme(sitio, resultado, excedidos);
  const [intro1, intro2] = introduccion(tx, semestre(resultado.fechaMuestreo) === 1 ? 'primer' : 'segundo');
  const automaticos: Record<CampoEdicion, string> = {
    intro1,
    intro2,
    objetivo: tx.objetivo,
    alcance: tx.alcance,
    resumen: tx.resumen,
    tabla: tx.tabla,
    conclusion: tx.conclusion,
    anexo: `${resultado.codigo} Informe de Resultados Análisis de Agua Natural (Efluente${resultado.locacion ? ` – ${resultado.locacion}` : ''}).`,
  };
  const corregidos = edicion ?? resultado.ediciones?.[sitio.id] ?? {};
  const textos = Object.fromEntries(
    Object.entries(automaticos).map(([c, auto]) => [c, corregidos[c as CampoEdicion]?.trim() || auto]),
  ) as Record<CampoEdicion, string>;
  return { filas, textos, automaticos, titulo: tx.titulo, laboratorio: tx.laboratorio, larvas: sitio.tipo === 'larvas' };
}

/** Logos del encabezado: los de la camaronera, ninguno si usa un texto o, si no tiene, el de Naturisa */
export const logosDelInforme = (sitio: Sitio) => (sitio.logos.length ? sitio.logos.map(urlLogo) : sitio.logoTexto ? [] : [LOGO_NATURISA]);

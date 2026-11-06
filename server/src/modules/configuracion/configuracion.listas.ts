// Listas que el usuario puede editar desde Configuración (sin cambiar el código). Cada una tiene sus valores
// de fábrica; lo que se guarda en la tabla `configuracion` (clave "lista.<id>") los reemplaza.
// Para hacer editable otra lista: agréguela aquí y lea sus valores con valoresLista(id).
import { CLIENTES_LABORATORIO, SECCIONES } from '../laboratorio/laboratorio.secciones.js';
import { PARTES_OXIGENOMETRO } from '../oxigenometros/oxigenometros.types.js';

export interface ListaEditable {
  id: string;
  /** Sección donde se usa (agrupa las listas en la pantalla) */
  seccion: string;
  nombre: string;
  descripcion: string;
  inicial: string[];
  /** Cada valor debe ser una sola palabra (los géneros se guardan juntos, separados por espacio) */
  sinEspacios?: boolean;
}

/** Centros de costo del presupuesto (valores de fábrica de las listas de sucursales; luego se editan en Configuración) */
const CENTROS_COSTO = [
  'Aquanaturisa', 'Biorey', 'Bonanza', 'Camino Real', 'Coaque', 'Esteromar', 'Fincacua', 'Golfomar', 'Granmar', 'Inducam',
  'Josefina', 'Juananu', 'Lanconor', 'Larviquest 1', 'Larviquest 2', 'Larviquest 3', 'Larviquest 4', 'Los Gelices',
  'Marchena', 'Margolfo', 'Matriz', 'Matriz AM', 'Matriz NM', 'Naturisa', 'Rio Nilo', 'Roblemar',
];

/** Géneros de fitoplancton: uno por cada campo con opciones de Análisis de Agua */
const generos: ListaEditable[] = SECCIONES.agua.campos
  .filter((c) => c.opciones)
  .map((c) => ({
    id: `laboratorio.${c.clave}`,
    seccion: 'Análisis de Agua',
    nombre: c.etiqueta,
    descripcion: 'Se eligen junto al conteo en los resultados.',
    inicial: c.opciones!,
    sinEspacios: true,
  }));

export const LISTAS: ListaEditable[] = [
  ...generos,
  {
    id: 'laboratorio.clientes',
    seccion: 'Laboratorio',
    nombre: 'Centros de costo del laboratorio',
    descripcion: 'Camaroneras, laboratorios y clientes que se eligen en "Identificación de la muestra".',
    inicial: CLIENTES_LABORATORIO,
  },
  {
    id: 'inspecciones.centros',
    seccion: 'Inspecciones SCI',
    nombre: 'Centros de costo de Inspecciones SCI',
    descripcion: 'Sucursales que se eligen en el check list de las inspecciones SCI.',
    inicial: CENTROS_COSTO,
  },
  {
    id: 'calendario.centros',
    seccion: 'Calendario y Auditorías',
    nombre: 'Centros de costo del Calendario',
    descripcion: 'Sucursales que se eligen en los eventos del calendario: auditorías ASC y BAP, inspecciones, capacitaciones…',
    inicial: CENTROS_COSTO,
  },
  {
    id: 'oxigenometros.partes',
    seccion: 'Oxigenómetros',
    nombre: 'Partes de oxigenómetros',
    descripcion: 'Partes que se pueden registrar como reparadas.',
    inicial: PARTES_OXIGENOMETRO,
  },
];

export const listaPorId = (id: string) => LISTAS.find((l) => l.id === id);

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
    nombre: 'Clientes del laboratorio',
    descripcion: 'Clientes o camaroneras externas que se suman a los centros de costo en "Identificación de la muestra".',
    inicial: CLIENTES_LABORATORIO,
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

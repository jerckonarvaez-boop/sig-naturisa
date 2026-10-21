import { Waves } from 'lucide-react';
import type { ModuleMeta, SubSection } from '../types';

export const RESULTADOS_AGUA: SubSection = {
  id: 'resultados',
  label: 'Resultados de análisis de agua',
  description: 'Resultados de los análisis del agua de afluente y efluente.',
  path: '/monitoreo-agua/resultados',
};

export const REPORTES_AGUA: SubSection = {
  id: 'reportes',
  label: 'Reportes de análisis de agua',
  description: 'Reportes de los análisis del agua de afluente y efluente.',
  path: '/monitoreo-agua/reportes',
};

/** Camaroneras e instalaciones con su ficha técnica (no va en el menú: se abre desde Monitoreo de agua y Reportes) */
export const FICHAS_TECNICAS: SubSection = {
  id: 'fichas',
  label: 'Fichas técnicas',
  description: 'Camaroneras e instalaciones: datos que salen en el informe de monitoreo PGC-025.',
  path: '/monitoreo-agua/fichas',
};

/** Puntos de monitoreo: cada subsección se divide en estas pestañas (la ruta es <subsección>/<id>) */
export const PUNTOS_MONITOREO = [
  { id: 'afluente', label: 'Afluente', description: 'Agua que ingresa a la camaronera (captación).' },
  { id: 'efluente', label: 'Efluente', description: 'Agua que se descarga de la camaronera.' },
] as const;

export type PuntoMonitoreo = (typeof PUNTOS_MONITOREO)[number]['id'];

export const meta: ModuleMeta = {
  id: 'monitoreo-agua',
  label: 'Monitoreo de agua',
  description: 'Resultados y reportes de análisis del agua de afluente y efluente.',
  path: '/monitoreo-agua',
  icon: Waves,
  status: 'activo',
  children: [RESULTADOS_AGUA, REPORTES_AGUA],
};

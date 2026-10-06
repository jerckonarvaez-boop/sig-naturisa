// Fases del plan de desarrollo mostradas en el Dashboard.
// Cambia "status" a medida que avance el proyecto.
export type PhaseStatus = 'completada' | 'en-curso' | 'pendiente';

export interface Phase {
  title: string;
  description: string;
  status: PhaseStatus;
}

export const DEVELOPMENT_PLAN: Phase[] = [
  { title: 'Fase 1', description: 'Configuración del proyecto + base de datos + interfaz inicial', status: 'completada' },
  { title: 'Fase 2', description: 'Datos maestros (áreas, usuarios, catálogos)', status: 'pendiente' },
  { title: 'Fase 3', description: 'Auditorías ASC y BAP (calendario listo; falta hallazgos y seguimiento)', status: 'en-curso' },
  { title: 'Fase 4', description: 'Laboratorios de análisis', status: 'pendiente' },
  { title: 'Fase 5', description: 'Inspecciones SCI (calendario + check list Buenas Prácticas)', status: 'en-curso' },
  { title: 'Fase 6', description: 'Gestión de desechos', status: 'pendiente' },
  { title: 'Fase 7', description: 'Presupuesto (dashboard + importación de Excel)', status: 'en-curso' },
  { title: 'Fase 8', description: 'Reportes e indicadores', status: 'pendiente' },
];

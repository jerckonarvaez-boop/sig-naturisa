import { SearchCheck } from 'lucide-react';
import type { ModuleMeta, SubSection } from '../types';

export const CALENDARIO_SCI: SubSection = {
  id: 'calendario-sci',
  label: 'Calendario',
  description: 'Inspecciones programadas y realizadas.',
  path: '/inspecciones-sci',
};

export const CHECKLIST_BP: SubSection = {
  id: 'checklist-bp',
  label: 'Check list Buenas Prácticas',
  description: 'Revisión de áreas previa a la inspección SCI.',
  path: '/inspecciones-sci/checklist',
};

export const meta: ModuleMeta = {
  id: 'inspecciones-sci',
  label: 'Inspecciones SCI',
  description: 'Inspecciones de la Subsecretaría de Calidad e Inocuidad (SCI).',
  path: '/inspecciones-sci',
  icon: SearchCheck,
  status: 'activo',
  children: [CALENDARIO_SCI, CHECKLIST_BP],
};

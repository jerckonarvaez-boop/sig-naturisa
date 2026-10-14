import { SearchCheck } from 'lucide-react';
import type { ModuleMeta, SubSection } from '../types';

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
  // Las fechas de inspección se programan en el Calendario general
  children: [CHECKLIST_BP],
};

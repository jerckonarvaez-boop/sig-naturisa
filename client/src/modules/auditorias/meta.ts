import { ClipboardCheck } from 'lucide-react';
import type { ModuleMeta, SubSection } from '../types';

export const CERTIFICACION_ASC: SubSection = {
  id: 'certificacion-asc',
  label: 'Certificación ASC',
  description: 'Aquaculture Stewardship Council: auditorías, hallazgos y seguimiento.',
  path: '/auditorias/asc',
};

export const CERTIFICACION_BAP: SubSection = {
  id: 'certificacion-bap',
  label: 'Certificación BAP',
  description: 'Best Aquaculture Practices: auditorías, hallazgos y seguimiento.',
  path: '/auditorias/bap',
};

export const meta: ModuleMeta = {
  id: 'auditorias',
  label: 'Auditorías',
  description: 'Gestión de auditorías por certificación.',
  path: '/auditorias',
  icon: ClipboardCheck,
  status: 'activo',
  children: [CERTIFICACION_ASC, CERTIFICACION_BAP],
};

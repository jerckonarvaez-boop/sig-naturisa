import { FlaskConical } from 'lucide-react';
import type { ModuleMeta, SubSection } from '../types';

export const OXIGENOMETROS: SubSection = {
  id: 'oxigenometros',
  label: 'Oxigenómetros',
  description: 'Reparación de partes y ahorro frente a comprar partes nuevas.',
  path: '/laboratorios/oxigenometros',
};

export const meta: ModuleMeta = {
  id: 'laboratorios',
  label: 'Laboratorios de análisis',
  description: 'Registro y control de análisis de laboratorio.',
  path: '/laboratorios',
  icon: FlaskConical,
  status: 'activo',
  children: [OXIGENOMETROS],
};

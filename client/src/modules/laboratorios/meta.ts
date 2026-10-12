import { FlaskConical } from 'lucide-react';
import type { ModuleMeta, SubSection } from '../types';

export const OXIGENOMETROS: SubSection = {
  id: 'oxigenometros',
  label: 'Oxigenómetros',
  description: 'Reparación de partes y ahorro frente a comprar partes nuevas.',
  path: '/laboratorios/oxigenometros',
};

export const ANALISIS_AGUA: SubSection = {
  id: 'agua',
  label: 'Análisis de Agua',
  description: 'Fitoplancton, análisis químico y bacteriología del agua (informes AA).',
  path: '/laboratorios/agua',
};

export const ANALISIS_SUELO: SubSection = {
  id: 'suelo',
  label: 'Análisis de Suelo',
  description: 'Humedad, pH y materia orgánica del suelo de piscinas (informes AS).',
  path: '/laboratorios/suelo',
};

export const PATOLOGIAS: SubSection = {
  id: 'patologia',
  label: 'Patologías en fresco',
  description: 'Análisis en fresco y bacteriología de camarones (informes AF).',
  path: '/laboratorios/patologias',
};

export const meta: ModuleMeta = {
  id: 'laboratorios',
  label: 'Laboratorios de análisis',
  description: 'Registro y control de análisis de laboratorio.',
  path: '/laboratorios',
  icon: FlaskConical,
  status: 'activo',
  children: [ANALISIS_AGUA, ANALISIS_SUELO, PATOLOGIAS, OXIGENOMETROS],
};

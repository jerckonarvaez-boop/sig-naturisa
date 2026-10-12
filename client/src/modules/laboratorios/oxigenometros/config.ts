import { CheckCircle2, Wrench, XCircle, type LucideIcon } from 'lucide-react';
import type { EstadoReparacion } from './types';

/** Apariencia de cada estado: siempre texto + ícono, nunca solo color */
export const ESTADOS: Record<EstadoReparacion, { label: string; icono: LucideIcon; badge: string }> = {
  reparado: {
    label: 'Reparado',
    icono: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  },
  'en-reparacion': {
    label: 'En reparación',
    icono: Wrench,
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  },
  'no-reparable': {
    label: 'No reparable',
    icono: XCircle,
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
};

export const ESTADOS_ORDEN: EstadoReparacion[] = ['reparado', 'en-reparacion', 'no-reparable'];

/** Partes de un oxigenómetro que se pueden registrar (lista validada; para agregar una, añádala aquí) */
export const PARTES = [
  'Sonda / sensor',
  'Tapa del sensor (cap)',
  'Membrana',
  'Cable',
  'Conector',
  'Medidor (lector)',
  'Tarjeta madre (board)',
  'Pantalla',
  'Teclado',
  'Batería / pilas',
];

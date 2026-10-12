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

/** Partes habituales de un oxigenómetro (se suman las que ya se hayan registrado) */
export const PARTES_SUGERIDAS = [
  'Sonda / sensor',
  'Tapa del sensor (cap)',
  'Membrana',
  'Cable',
  'Conector',
  'Medidor (lector)',
  'Pantalla',
  'Teclado',
  'Batería / pilas',
];

import { AlertTriangle, CalendarClock, CheckCircle2, History, XCircle, type LucideIcon } from 'lucide-react';
import type { EstadoEvento, EstadoVisual, TipoEvento } from './types';

/** Tipos de evento: nombre, abreviatura y página del módulo al que pertenecen */
export const TIPOS: Record<TipoEvento, { label: string; corto: string; ruta: string }> = {
  'auditoria-asc': { label: 'Auditoría ASC', corto: 'ASC', ruta: '/auditorias/asc' },
  'auditoria-bap': { label: 'Auditoría BAP', corto: 'BAP', ruta: '/auditorias/bap' },
  // SCI = Subsecretaría de Calidad e Inocuidad
  'inspeccion-sci': { label: 'Inspección SCI', corto: 'SCI', ruta: '/inspecciones-sci' },
};

/** Estados que el usuario puede elegir en el formulario */
export const ESTADOS_EDITABLES: EstadoEvento[] = ['programado', 'realizado', 'reprogramado', 'cancelado'];

/** Apariencia de cada estado: siempre texto + ícono, nunca solo color */
export const ESTADOS: Record<EstadoVisual, { label: string; icono: LucideIcon; chip: string; badge: string }> = {
  programado: {
    label: 'Programado',
    icono: CalendarClock,
    chip: 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-500/15 dark:text-sky-100',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
  },
  realizado: {
    label: 'Realizado',
    icono: CheckCircle2,
    chip: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  },
  reprogramado: {
    label: 'Reprogramado',
    icono: History,
    chip: 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  },
  cancelado: {
    label: 'Cancelado',
    icono: XCircle,
    chip: 'border-slate-400 bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  vencido: {
    label: 'Vencido',
    icono: AlertTriangle,
    chip: 'border-red-500 bg-red-50 text-red-900 dark:bg-red-500/15 dark:text-red-100',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200',
  },
};

/** Pestañas de la vista de lista y su texto cuando no hay eventos */
export type Pestana = 'proximos' | 'vencidos' | 'realizados' | 'todos';

export const PESTANAS: { clave: Pestana; label: string; vacio: string }[] = [
  { clave: 'proximos', label: 'Próximos', vacio: 'No hay fechas programadas.' },
  { clave: 'vencidos', label: 'Vencidos', vacio: 'No hay eventos vencidos.' },
  { clave: 'realizados', label: 'Realizados', vacio: 'Aún no hay eventos realizados.' },
  { clave: 'todos', label: 'Todos', vacio: 'Aún no hay eventos registrados.' },
];

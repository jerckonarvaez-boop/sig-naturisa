import type { ReactNode } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';
import { MESES } from '@/constants/fechas';
import type { Vista } from '../hooks/useCalendario';

interface BarraCalendarioProps {
  titulo: string;
  vista: Vista;
  anio: number;
  mes: number;
  onMoverMes: (delta: number) => void;
  onHoy: () => void;
  onVista: (vista: Vista) => void;
  onNuevo: () => void;
}

/** Barra superior del calendario: mes visible, cambio de vista y "Nuevo evento". */
export function BarraCalendario({ titulo, vista, anio, mes, onMoverMes, onHoy, onVista, onNuevo }: BarraCalendarioProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <h2 className="mr-2 text-base font-semibold">{titulo}</h2>
      {vista === 'mes' && (
        <div className="flex items-center gap-1">
          <BotonIcono etiqueta="Mes anterior" onClick={() => onMoverMes(-1)}>
            <ChevronLeft size={16} />
          </BotonIcono>
          <span className="min-w-36 text-center text-sm font-semibold">
            {MESES[mes]} {anio}
          </span>
          <BotonIcono etiqueta="Mes siguiente" onClick={() => onMoverMes(1)}>
            <ChevronRight size={16} />
          </BotonIcono>
          <button
            type="button"
            onClick={onHoy}
            className="ml-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Hoy
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700" role="tablist" aria-label="Vista">
          <BotonVista activo={vista === 'mes'} onClick={() => onVista('mes')} icono={<CalendarDays size={14} />} texto="Mes" />
          <BotonVista activo={vista === 'lista'} onClick={() => onVista('lista')} icono={<List size={14} />} texto="Lista" />
        </div>
        <button
          type="button"
          onClick={onNuevo}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          <Plus size={15} /> Nuevo evento
        </button>
      </div>
    </div>
  );
}

function BotonIcono({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="rounded-md p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function BotonVista({ activo, onClick, icono, texto }: { activo: boolean; onClick: () => void; icono: ReactNode; texto: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activo}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
        activo ? 'bg-brand-900 text-white dark:bg-sky-600' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {icono}
      {texto}
    </button>
  );
}

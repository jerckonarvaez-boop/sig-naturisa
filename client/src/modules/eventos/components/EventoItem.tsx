import { ESTADOS, TIPOS } from '../config';
import { deISO, textoRelativo } from '@/utils/fechas';
import { campamentosCorto, campamentosDe, estadoVisual } from '../logic/eventos';
import type { Evento } from '../types';

interface EventoItemProps {
  evento: Evento;
  mostrarTipo: boolean;
  onClick?: (evento: Evento) => void;
}

/** Fila compacta de un evento: bloque de fecha + título + estado. */
export function EventoItem({ evento, mostrarTipo, onClick }: EventoItemProps) {
  const fecha = deISO(evento.fechaInicio);
  const estado = estadoVisual(evento);
  const { icono: Icono, label } = ESTADOS[estado];
  const vencido = estado === 'vencido';

  return (
    <button
      type="button"
      onClick={() => onClick?.(evento)}
      title={campamentosDe(evento).join(', ') || undefined}
      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <span
        className={`flex w-9 shrink-0 flex-col items-center rounded-md py-0.5 leading-none ${
          vencido ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-sky-50 text-brand-900 dark:bg-sky-500/15 dark:text-sky-100'
        }`}
      >
        <span className="text-sm font-bold">{fecha.getDate()}</span>
        <span className="mt-0.5 text-[9px] uppercase">
          {fecha.toLocaleDateString('es-EC', { month: 'short' }).replace('.', '')}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] leading-tight font-medium">
          {mostrarTipo && <span className="mr-1 font-bold">{TIPOS[evento.tipo].corto}</span>}
          {evento.titulo}
        </span>
        <span
          className={`flex min-w-0 items-center gap-1 text-[11px] leading-tight ${vencido ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Icono size={11} aria-label={label} />
          {vencido ? `Vencido · ${textoRelativo(evento.fechaInicio).toLowerCase()}` : textoRelativo(evento.fechaInicio)}
          {evento.sucursal && <span className="truncate"> · {campamentosCorto(evento)}</span>}
        </span>
      </span>
    </button>
  );
}

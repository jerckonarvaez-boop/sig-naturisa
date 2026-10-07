import { ESTADOS, TIPOS } from '../config';
import { estadoVisual, rangoFechas } from '../logic/fechas';
import type { Evento } from '../types';

interface EventoChipProps {
  evento: Evento;
  mostrarTipo: boolean;
  onClick: (evento: Evento) => void;
}

/** Evento dentro de una celda del calendario. El color y el ícono indican el estado. */
export function EventoChip({ evento, mostrarTipo, onClick }: EventoChipProps) {
  const estado = estadoVisual(evento);
  const { icono: Icono, chip, label } = ESTADOS[estado];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(evento);
      }}
      title={`${TIPOS[evento.tipo].label} · ${evento.titulo}\n${rangoFechas(evento)} · ${label}${evento.sucursal ? ` · ${evento.sucursal}` : ''}`}
      className={`flex w-full items-center gap-1 truncate rounded border-l-[3px] px-1 py-px text-left text-[10px] leading-tight font-medium hover:brightness-95 ${chip}`}
    >
      <Icono size={10} className="shrink-0" aria-label={label} />
      {mostrarTipo && <span className="shrink-0 font-bold">{TIPOS[evento.tipo].corto}</span>}
      {!mostrarTipo && <span className="truncate sm:hidden">{evento.titulo}</span>}
      <span className="hidden truncate sm:inline">{evento.titulo}</span>
    </button>
  );
}

import { aISO, cubreDia, DIAS_SEMANA, hoyISO, semanasDelMes } from '../logic/fechas';
import type { Evento } from '../types';
import { EventoChip } from './EventoChip';

const MAX_POR_DIA = 2;

interface CalendarioMesProps {
  anio: number;
  mes: number;
  eventos: Evento[];
  mostrarTipo: boolean;
  onDia: (iso: string) => void;
  onEvento: (evento: Evento) => void;
  /** Al pulsar "+N más" */
  onVerDia: (iso: string) => void;
}

/** Cuadrícula mensual (lunes a domingo). Clic en un día vacío = nuevo evento en esa fecha. */
export function CalendarioMes({ anio, mes, eventos, mostrarTipo, onDia, onEvento, onVerDia }: CalendarioMesProps) {
  const hoy = hoyISO();
  const semanas = semanasDelMes(anio, mes);

  return (
    <div>
      <div>
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {semanas.flat().map((fecha) => {
            const iso = aISO(fecha);
            const delMes = fecha.getMonth() === mes;
            const esHoy = iso === hoy;
            const delDia = eventos.filter((e) => cubreDia(e, iso));
            const visibles = delDia.slice(0, MAX_POR_DIA);
            const ocultos = delDia.length - visibles.length;

            return (
              <div
                key={iso}
                role="button"
                tabIndex={0}
                aria-label={`${fecha.getDate()}: ${delDia.length} eventos. Pulse para crear un evento.`}
                onClick={() => onDia(iso)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onDia(iso);
                  }
                }}
                className={`group min-h-16 cursor-pointer border-r border-b border-slate-100 p-0.5 transition-colors hover:bg-sky-50/60 focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-slate-800 dark:hover:bg-slate-800/50 [&:nth-child(7n)]:border-r-0 ${
                  delMes ? '' : 'bg-slate-50/70 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      esHoy
                        ? 'bg-brand-900 font-bold text-white dark:bg-sky-600'
                        : delMes
                          ? 'text-slate-700 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {fecha.getDate()}
                  </span>
                  <span className="pr-1 text-xs leading-none text-slate-400 opacity-0 group-hover:opacity-100">+</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {visibles.map((e) => (
                    <EventoChip key={e.id} evento={e} mostrarTipo={mostrarTipo} onClick={onEvento} />
                  ))}
                  {ocultos > 0 && (
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onVerDia(iso);
                      }}
                      className="px-1 text-left text-[10px] font-semibold text-brand-500 hover:underline"
                    >
                      +{ocultos} más
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

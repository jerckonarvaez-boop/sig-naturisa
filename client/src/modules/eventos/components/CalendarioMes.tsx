import { DIAS_SEMANA } from '@/constants/fechas';
import { aISO, hoyISO, semanasDelMes } from '@/utils/fechas';
import { ESTADOS, TIPOS } from '../config';
import { campamentosCorto, campamentosDe, cubreDia, estadoVisual, fechaFinal, rangoFechas } from '../logic/eventos';
import type { Evento } from '../types';

/** Filas de eventos por semana; los demás se resumen en "+N más" en su día */
const MAX_CARRILES = 3;

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

/** Un evento dentro de una semana: columnas que ocupa (0 = lunes) y su fila */
interface Tramo {
  evento: Evento;
  desde: number;
  hasta: number;
  carril: number;
  /** Empieza o termina fuera de esta semana (la barra sigue en la semana anterior / siguiente) */
  sigueAntes: boolean;
  sigueDespues: boolean;
}

/** Reparte los eventos de la semana en filas sin que se encimen: un evento de varios días es una sola barra */
function tramosDeLaSemana(dias: string[], eventos: Evento[]): Tramo[] {
  const delaSemana = eventos
    .filter((e) => e.fechaInicio <= dias[6] && fechaFinal(e) >= dias[0])
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || fechaFinal(b).localeCompare(fechaFinal(a)) || a.id - b.id);
  const finDeCarril: number[] = [];
  return delaSemana.map((evento) => {
    const desde = Math.max(0, dias.indexOf(evento.fechaInicio) === -1 ? 0 : dias.indexOf(evento.fechaInicio));
    const fin = fechaFinal(evento);
    const hasta = fin > dias[6] ? 6 : dias.indexOf(fin);
    let carril = finDeCarril.findIndex((f) => f < desde);
    if (carril === -1) carril = finDeCarril.length;
    finDeCarril[carril] = hasta;
    return { evento, desde, hasta, carril, sigueAntes: evento.fechaInicio < dias[0], sigueDespues: fin > dias[6] };
  });
}

/**
 * Cuadrícula mensual compacta (lunes a domingo). Cada evento es una barra; si dura varios días, una sola barra que
 * cruza esos días. Clic en un día = nuevo evento en esa fecha; clic en una barra = editarlo.
 */
export function CalendarioMes({ anio, mes, eventos, mostrarTipo, onDia, onEvento, onVerDia }: CalendarioMesProps) {
  const hoy = hoyISO();
  const semanas = semanasDelMes(anio, mes);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {d}
          </div>
        ))}
      </div>
      {semanas.map((semana) => {
        const dias = semana.map(aISO);
        const tramos = tramosDeLaSemana(dias, eventos);
        const visibles = tramos.filter((t) => t.carril < MAX_CARRILES);
        const carriles = Math.min(MAX_CARRILES, Math.max(0, ...tramos.map((t) => t.carril + 1)));
        const ocultosDe = (i: number) => tramos.filter((t) => t.carril >= MAX_CARRILES && t.desde <= i && i <= t.hasta).length;
        const hayOcultos = dias.some((_, i) => ocultosDe(i) > 0);

        return (
          <div
            key={dias[0]}
            className="grid grid-cols-7 border-b border-slate-100 last:border-b-0 dark:border-slate-800"
            // Número del día, una fila por carril de eventos, "+N más" si hace falta y un margen (más alto si no hay eventos)
            style={{ gridTemplateRows: ['20px', ...Array<string>(carriles).fill('19px'), hayOcultos ? '15px' : '', carriles ? '4px' : '12px'].filter(Boolean).join(' ') }}
          >
            {/* Fondo de cada día: número y clic para crear */}
            {semana.map((fecha, i) => {
              const iso = dias[i];
              const delMes = fecha.getMonth() === mes;
              const esHoy = iso === hoy;
              const total = eventos.filter((e) => cubreDia(e, iso)).length;
              return (
                <div
                  key={iso}
                  role="button"
                  tabIndex={0}
                  aria-label={`${fecha.getDate()}: ${total} ${total === 1 ? 'evento' : 'eventos'}. Pulse para crear un evento.`}
                  onClick={() => onDia(iso)}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onDia(iso);
                    }
                  }}
                  style={{ gridColumn: i + 1, gridRow: '1 / -1' }}
                  className={`group cursor-pointer border-r border-slate-100 px-1 pt-0.5 transition-colors hover:bg-sky-50/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                    i === 6 ? 'border-r-0' : ''
                  } ${delMes ? '' : 'bg-slate-50/70 dark:bg-slate-950/40'}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] ${
                        esHoy
                          ? 'bg-brand-900 font-bold text-white dark:bg-sky-600'
                          : delMes
                            ? 'text-slate-700 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {fecha.getDate()}
                    </span>
                    <span className="text-xs leading-none text-slate-400 opacity-0 group-hover:opacity-100">+</span>
                  </div>
                </div>
              );
            })}

            {/* Barras de eventos */}
            {visibles.map((t) => (
              <BarraEvento key={t.evento.id} tramo={t} mostrarTipo={mostrarTipo} onClick={onEvento} />
            ))}

            {/* "+N más" en los días con eventos que no caben */}
            {hayOcultos &&
              dias.map((iso, i) => {
                const n = ocultosDe(i);
                return n ? (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => onVerDia(iso)}
                    style={{ gridColumn: i + 1, gridRow: carriles + 2 }}
                    className="relative z-10 truncate px-1.5 text-left text-[10px] leading-[15px] font-semibold text-brand-500 hover:underline"
                  >
                    +{n} más
                  </button>
                ) : null;
              })}
          </div>
        );
      })}
    </div>
  );
}

/** Barra de un evento: color e ícono según el estado, tipo, título y campamentos */
function BarraEvento({ tramo, mostrarTipo, onClick }: { tramo: Tramo; mostrarTipo: boolean; onClick: (e: Evento) => void }) {
  const { evento, desde, hasta, carril, sigueAntes, sigueDespues } = tramo;
  const estado = estadoVisual(evento);
  const { icono: Icono, chip, label } = ESTADOS[estado];
  const lugares = campamentosDe(evento);
  return (
    <button
      type="button"
      onClick={() => onClick(evento)}
      title={`${TIPOS[evento.tipo].label} · ${evento.titulo}\n${rangoFechas(evento)} · ${label}${lugares.length ? `\n${lugares.join(', ')}` : ''}`}
      style={{ gridColumn: `${desde + 1} / ${hasta + 2}`, gridRow: carril + 2 }}
      className={`relative z-10 mx-0.5 my-px flex min-w-0 items-center gap-1 truncate px-1 text-left text-[10px] leading-tight font-medium hover:brightness-95 ${chip} ${
        sigueAntes ? 'rounded-l-none border-l-0' : 'rounded-l border-l-[3px]'
      } ${sigueDespues ? 'rounded-r-none' : 'rounded-r'}`}
    >
      <Icono size={10} className="shrink-0" aria-label={label} />
      {mostrarTipo && <span className="shrink-0 font-bold">{TIPOS[evento.tipo].corto}</span>}
      <span className="truncate">
        {evento.titulo}
        {lugares.length > 0 && hasta - desde >= 1 && <span className="font-normal opacity-75"> · {campamentosCorto(evento, 3)}</span>}
      </span>
    </button>
  );
}

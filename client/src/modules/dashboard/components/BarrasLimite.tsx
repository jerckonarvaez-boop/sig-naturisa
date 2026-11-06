import { AlertTriangle } from 'lucide-react';
import { useTip } from '@/components/charts/Tooltip';
import type { FilaLimite } from '../logic/resumen';

const numero = (n: number) => n.toLocaleString('es-EC', { maximumFractionDigits: 3 });
const pct = (f: number) => `${Math.round(f * 100)} %`;

/**
 * Cada parámetro del efluente: su valor más alto del año como porcentaje de su límite máximo permisible, así
 * parámetros de distintas unidades se comparan en una sola escala. La raya vertical es el límite (100 %); lo que lo
 * supera va en rojo, separado por 2px, con ícono y texto.
 */
export function BarrasLimite({ filas }: { filas: FilaLimite[] }) {
  const tip = useTip();
  // La escala llega al menos al límite, y más allá si algún parámetro lo supera
  const escala = Math.max(1, ...filas.map((f) => f.fraccion));
  const ancho = (f: number) => `${((f / escala) * 100).toFixed(2)}%`;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3.5 rounded-sm bg-chart-serie" /> Valor más alto del año
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-slate-500 dark:bg-slate-400" /> Límite (100 %)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3.5 rounded-sm bg-chart-exceso" /> Supera el límite
        </span>
      </div>
      <ul className="flex flex-col">
        {filas.map((f) => (
          <li
            key={f.clave}
            tabIndex={0}
            {...tip({
              valor: `${numero(f.maximo)} ${f.unidad}`,
              etiqueta: f.nombre,
              detalle: `${pct(f.fraccion)} del límite (${f.limite} ${f.unidad}) · ${f.resultados} ${f.resultados === 1 ? 'resultado' : 'resultados'}`,
            })}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-1.5 outline-none hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-chart-serie sm:grid-cols-[minmax(130px,34%)_1fr_minmax(120px,auto)] dark:hover:bg-slate-800"
          >
            <span className="truncate text-[13px]" title={f.nombre}>
              {f.nombre}
            </span>
            <span className="relative col-span-2 row-start-2 block h-2.5 sm:col-span-1 sm:row-start-auto">
              <span className="absolute inset-y-0 left-0 rounded-r bg-chart-pista" style={{ width: ancho(1) }} />
              {f.fraccion > 0 && (
                <span
                  className={`absolute inset-y-0 left-0 bg-chart-serie ${f.supera ? '' : 'rounded-r'}`}
                  style={{ width: `max(2px, ${ancho(Math.min(f.fraccion, 1))})` }}
                />
              )}
              {f.fraccion > 1 && (
                <span
                  className="absolute inset-y-0 rounded-r bg-chart-exceso"
                  style={{ left: `calc(${ancho(1)} + 2px)`, width: `max(2px, calc(${ancho(f.fraccion - 1)} - 2px))` }}
                />
              )}
              <span className="absolute -inset-y-1 w-0.5 bg-slate-500 dark:bg-slate-400" style={{ left: ancho(1) }} aria-hidden />
            </span>
            <span className="text-right text-[13px] whitespace-nowrap tabular-nums">
              <span className={`inline-flex items-center gap-1 font-semibold ${f.supera ? 'text-red-700 dark:text-red-400' : ''}`}>
                {f.supera && <AlertTriangle size={12} aria-label="Supera el límite" />}
                {pct(f.fraccion)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {' '}
                · {numero(f.maximo)} de {f.limite}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

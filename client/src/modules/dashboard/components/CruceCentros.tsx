import { useState } from 'react';
import { useTip } from '@/components/charts/Tooltip';
import { miles } from '@/utils/numeros';

interface CruceCentrosProps {
  /** grupo: la sección del análisis (encabeza sus columnas) */
  columnas: { key: string; label: string; grupo: string }[];
  filas: { centro: string; total: number; celdas: number[] }[];
  /** Muestra solo las primeras N filas, con un botón "Ver todos" */
  limite?: number;
}

/**
 * Tabla centro de costo × análisis: cuántos informes de cada análisis tuvo cada centro. El fondo de la celda se
 * intensifica con la cantidad (un solo tono, de claro a oscuro); el número siempre está escrito.
 */
export function CruceCentros({ columnas, filas, limite = 8 }: CruceCentrosProps) {
  const tip = useTip();
  const [verTodas, setVerTodas] = useState(false);
  const max = Math.max(1, ...filas.flatMap((f) => f.celdas));
  const visibles = verTodas ? filas : filas.slice(0, limite);
  const fondo = (n: number) => (n ? `color-mix(in oklab, var(--chart-serie) ${Math.round(10 + (n / max) * 35)}%, transparent)` : undefined);
  const informes = (n: number) => `${miles(n)} ${n === 1 ? 'informe' : 'informes'}`;
  // Columnas seguidas de la misma sección (Agua, Suelo, Patología) comparten un encabezado
  const grupos: { nombre: string; columnas: number }[] = [];
  for (const c of columnas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.nombre === c.grupo) ultimo.columnas++;
    else grupos.push({ nombre: c.grupo, columnas: 1 });
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 text-[13px] tabular-nums">
          <thead className="text-xs text-slate-500 dark:text-slate-400">
            {grupos.length > 1 && (
              <tr>
                <td />
                {grupos.map((g) => (
                  <th key={g.nombre} scope="colgroup" colSpan={g.columnas} className="border-b border-slate-200 px-2 pt-1 text-center font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    {g.nombre}
                  </th>
                ))}
                <td />
              </tr>
            )}
            <tr>
              <th scope="col" className="px-2 py-1 text-left align-bottom font-semibold">
                Centro de costo
              </th>
              {columnas.map((c) => (
                <th key={c.key} scope="col" className="px-2 py-1 text-center align-bottom font-semibold">
                  {c.label}
                </th>
              ))}
              <th scope="col" className="px-2 py-1 text-right align-bottom font-semibold">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.centro}>
                <th scope="row" className="max-w-48 truncate px-2 py-1 text-left font-normal" title={f.centro}>
                  {f.centro}
                </th>
                {f.celdas.map((n, i) => (
                  <td
                    key={columnas[i].key}
                    tabIndex={0}
                    {...tip({ valor: informes(n), etiqueta: f.centro, detalle: columnas[i].label })}
                    className={`rounded px-2 py-1 text-center outline-none focus-visible:outline-2 focus-visible:outline-chart-serie ${n ? 'font-semibold' : 'text-slate-400 dark:text-slate-500'}`}
                    style={{ background: fondo(n) }}
                  >
                    {n ? miles(n) : '—'}
                  </td>
                ))}
                <td className="px-2 py-1 text-right font-semibold">{miles(f.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filas.length > limite && (
        <button type="button" onClick={() => setVerTodas((v) => !v)} className="mt-1 px-2 text-xs font-semibold text-brand-500 hover:underline">
          {verTodas ? 'Ver menos' : `Ver todos (${filas.length})`}
        </button>
      )}
    </div>
  );
}

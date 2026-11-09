import { useState } from 'react';
import { useTip } from '@/components/charts/Tooltip';
import { nivelPatologia, NIVELES_PATOLOGIA } from '@/modules/laboratorios/analisis/logic/laboratorio';
import type { CampoLab } from '@/modules/laboratorios/analisis/types';
import { referenciaDe, tieneReferencia, unidadDe, valorTexto, type Celda, type FilaTabla } from '../logic/resultadosLab';

interface TablaResultadosProps {
  campos: CampoLab[];
  filas: FilaTabla[];
  /** Columna del parámetro que muestran los gráficos */
  parametro: string | null;
  onParametro: (clave: string) => void;
  /** Encabezado de la primera columna (Campamento / Muestra) */
  titulo: string;
  limite?: number;
}

const ALTO = 'text-red-700 dark:text-red-400';
const BAJO = 'text-blue-700 dark:text-blue-400';

/**
 * Resultados por campamento (promedio de sus muestras) o por muestra. Parámetros con referencia: el valor fuera de ella
 * lleva flecha (▲ sobre · ▼ bajo) y color, y en los promedios cuántas muestras quedaron fuera. Conteos y grados sin
 * referencia: el fondo se intensifica con el valor (un solo tono). Tocar un encabezado lo grafica.
 */
export function TablaResultados({ campos, filas, parametro, onParametro, titulo, limite = 12 }: TablaResultadosProps) {
  const tip = useTip();
  const [verTodas, setVerTodas] = useState(false);
  const visibles = verTodas ? filas : filas.slice(0, limite);
  const maximos = campos.map((_, i) => Math.max(0, ...filas.map((f) => f.celdas[i].valor ?? 0)));

  const fondo = (c: CampoLab, i: number, v: number | null) => {
    if (v == null || v <= 0 || tieneReferencia(c)) return undefined;
    const escala = c.escala === 'patologia' ? 4 : maximos[i];
    if (!escala) return undefined;
    return `color-mix(in oklab, var(--chart-serie) ${Math.round(8 + Math.min(1, v / escala) * 37)}%, transparent)`;
  };

  const detalle = (c: CampoLab, x: Celda) => {
    const partes = [c.etiqueta];
    if (x.n > 1) partes.push(`promedio de ${x.n} muestras (mín. ${valorTexto(x.minimo)} · máx. ${valorTexto(x.maximo)})`);
    if (c.escala === 'patologia' && x.valor != null) partes.push(`nivel ${NIVELES_PATOLOGIA[nivelPatologia(x.valor)].label.toLowerCase()}`);
    if (x.estado === 'alto') partes.push('▲ sobre la referencia');
    if (x.estado === 'bajo') partes.push('▼ bajo la referencia');
    if (x.n > 1 && x.altos) partes.push(`▲ ${x.altos} sobre la referencia`);
    if (x.n > 1 && x.bajos) partes.push(`▼ ${x.bajos} bajo la referencia`);
    const ref = referenciaDe(c);
    if (ref) partes.push(ref);
    return partes.join(' · ');
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 text-[13px] tabular-nums">
          <thead>
            <tr className="text-xs text-slate-500 dark:text-slate-400">
              <th scope="col" className="sticky left-0 z-10 bg-white px-2 py-1 text-left align-bottom font-semibold dark:bg-slate-900">
                {titulo}
              </th>
              {campos.map((c) => {
                const activo = c.clave === parametro;
                return (
                  <th key={c.clave} scope="col" className="min-w-20 align-bottom font-normal">
                    <button
                      type="button"
                      aria-pressed={activo}
                      onClick={() => onParametro(c.clave)}
                      title="Graficar este parámetro"
                      className={`w-full rounded-md px-1.5 py-1 text-center hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-chart-serie dark:hover:bg-slate-800 ${
                        activo ? 'bg-sky-50 shadow-[inset_0_-3px_0_var(--chart-serie)] dark:bg-sky-500/10' : ''
                      }`}
                    >
                      <span className="block font-semibold text-slate-700 dark:text-slate-200">{c.etiqueta}</span>
                      {unidadDe(c) && <span className="block text-[11px]">{unidadDe(c)}</span>}
                      {referenciaDe(c) && !c.escala && <span className="block text-[11px]">{referenciaDe(c)}</span>}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.key}>
                <th scope="row" className="sticky left-0 z-10 max-w-44 bg-white px-2 py-1 text-left font-normal dark:bg-slate-900">
                  <span className="block truncate" title={f.label}>
                    {f.label}
                  </span>
                  {f.sub && <span className="block text-[11px] text-slate-500 dark:text-slate-400">{f.sub}</span>}
                </th>
                {f.celdas.map((x, i) => {
                  const c = campos[i];
                  // Solo el valor de una muestra se colorea; en un promedio, las marcas ▲n ▼n dicen cuántas quedaron fuera
                  const estado = x.estado;
                  return (
                    <td
                      key={c.clave}
                      tabIndex={x.n ? 0 : -1}
                      {...(x.n ? tip({ valor: `${valorTexto(x.valor)} ${unidadDe(c)}`.trim(), etiqueta: f.label, detalle: detalle(c, x) }) : {})}
                      className={`rounded px-2 py-1 text-center whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-chart-serie ${
                        x.n ? '' : 'text-slate-400 dark:text-slate-500'
                      } ${estado === 'alto' ? `font-semibold ${ALTO}` : estado === 'bajo' ? `font-semibold ${BAJO}` : ''}`}
                      style={{ background: fondo(c, i, x.valor) }}
                    >
                      {valorTexto(x.valor)}
                      {x.estado && <span aria-label={x.estado === 'alto' ? 'sobre la referencia' : 'bajo la referencia'}> {x.estado === 'alto' ? '▲' : '▼'}</span>}
                      {x.n > 1 && (x.altos > 0 || x.bajos > 0) && (
                        <span className="ml-1 text-[11px]">
                          {x.altos > 0 && <span className={ALTO} aria-label={`${x.altos} sobre la referencia`}>▲{x.altos}</span>}
                          {x.bajos > 0 && <span className={`${BAJO} ${x.altos ? 'ml-0.5' : ''}`} aria-label={`${x.bajos} bajo la referencia`}>▼{x.bajos}</span>}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filas.length > limite && (
        <button type="button" onClick={() => setVerTodas((v) => !v)} className="mt-1 px-2 text-xs font-semibold text-brand-500 hover:underline">
          {verTodas ? 'Ver menos' : `Ver todas (${filas.length})`}
        </button>
      )}
    </div>
  );
}

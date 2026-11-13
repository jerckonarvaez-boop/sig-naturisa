import type { ReactNode } from 'react';
import { useTip } from './Tooltip';
import { useElementWidth } from '@/hooks/useElementWidth';

export interface FilaBarras {
  key: string;
  label: string;
  /** Texto bajo el nombre (unidad, referencia) */
  sub?: string;
  /** Clase que define el color de la fila en la variable --serie (con su tono para el tema oscuro) */
  clase: string;
  icono?: ReactNode;
  /** Rango de referencia fijo: líneas punteadas dentro de la fila */
  min?: number;
  max?: number;
  /** Tope fijo de la escala de la fila (ej. 4 en los grados de patología); sin indicar, el mayor valor */
  tope?: number;
  puntos: { categoria: string; valor: number; titulo: string; detalle?: string; fuera?: boolean }[];
}

interface BarrasPorFilaChartProps {
  /** Columnas, en orden (ej. cada análisis de una piscina) */
  categorias: { key: string; label: string }[];
  filas: FilaBarras[];
  formato: (v: number) => string;
  formatoLargo?: (v: number, fila: FilaBarras) => string;
}

const SERIE = 'var(--serie, var(--chart-serie))';
const ALTO = 78; // alto de cada fila
const TOPE = 18; // aire para el valor sobre la barra más alta
const BARRA = 34; // ancho máximo de barra

/**
 * Un solo cuadro con todo: una fila por parámetro y una columna por análisis. Cada fila tiene su propia escala
 * (desde cero), así que se comparan los análisis de un mismo parámetro aunque unos midan 0,02 y otros 900.
 * Una barra cortada con una raya diagonal es un valor muy por encima del resto (su número sí es el real).
 */
export function BarrasPorFilaChart({ categorias, filas, formato, formatoLargo = (v) => formato(v) }: BarrasPorFilaChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const tip = useTip();
  const n = Math.max(categorias.length, 1);
  const banda = width / n;
  const ancho = Math.max(6, Math.min(BARRA, banda * 0.62));
  const cx = (i: number) => banda * (i + 0.5);
  const base = ALTO - 8;

  return (
    <div className="grid grid-cols-[minmax(8.5rem,13rem)_minmax(0,1fr)] gap-x-3">
      {filas.map((fila, f) => {
        const valores = fila.puntos.map((p) => p.valor);
        // Un valor disparado (más del triple del siguiente) no fija la escala: su barra se corta arriba, con una marca
        const orden = [...valores].sort((a, b) => b - a);
        const mayor = orden.length > 1 && orden[1] > 0 && orden[0] > orden[1] * 3 ? orden[1] * 1.25 : Math.max(...valores, 0);
        // La referencia entra en la escala solo si queda cerca de los valores (si no, aplastaría las barras)
        const refs = [fila.min, fila.max].filter((r): r is number => r != null && r <= mayor * 1.6);
        const tope = fila.tope ?? (Math.max(mayor, ...refs) || 1);
        const y = (v: number) => base - (base - TOPE) * (Math.min(v, tope) / tope);
        const porCategoria = new Map(fila.puntos.map((p) => [p.categoria, p]));
        return (
          <div key={fila.key} className={`col-span-2 grid grid-cols-subgrid items-center border-t border-slate-200 first:border-t-0 dark:border-slate-800 ${fila.clase}`}>
            <div className="flex min-w-0 items-center gap-2 py-2">
              {fila.icono && (
                <span className="grid size-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: SERIE }} aria-hidden="true">
                  {fila.icono}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{fila.label}</p>
                {fila.sub && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{fila.sub}</p>}
              </div>
            </div>
            <div ref={f === 0 ? ref : undefined} className="min-w-0">
              {width > 0 && (
                <svg width={width} height={ALTO} className="block" role="img" aria-label={`${fila.label}: barras por análisis`}>
                  <line x1={0} x2={width} y1={base} y2={base} className="stroke-chart-rejilla" strokeWidth={1} />
                  {refs.map((r) => (
                    <line key={r} x1={0} x2={width} y1={y(r)} y2={y(r)} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={1} strokeDasharray="4 3" />
                  ))}
                  {categorias.map((c, i) => {
                    const p = porCategoria.get(c.key);
                    if (!p)
                      return (
                        <text key={c.key} x={cx(i)} y={base - 6} textAnchor="middle" className="fill-slate-400 text-[11px] dark:fill-slate-600">
                          —
                        </text>
                      );
                    const h = Math.max(base - y(p.valor), p.valor > 0 ? 2 : 0);
                    const cortada = p.valor > tope;
                    return (
                      <g
                        key={c.key}
                        tabIndex={0}
                        role="img"
                        aria-label={`${p.titulo}: ${formatoLargo(p.valor, fila)}${p.fuera ? ' (fuera de la referencia)' : ''}`}
                        className="outline-none [&:focus-visible>rect]:fill-slate-200/50"
                        {...tip({ valor: formatoLargo(p.valor, fila), etiqueta: `${fila.label} · ${p.titulo}`, detalle: p.detalle })}
                      >
                        <rect x={banda * i} y={0} width={banda} height={ALTO} fill="transparent" />
                        {h > 0 && <path d={columna(cx(i) - ancho / 2, base - h, ancho, h)} style={p.fuera ? undefined : { fill: SERIE }} className={p.fuera ? 'fill-chart-exceso' : ''} />}
                        {cortada && <path d={`M${cx(i) - ancho / 2 - 2},${base - h + 12} l${ancho + 4},-5`} className="stroke-white dark:stroke-slate-900" strokeWidth={3} />}
                        <text
                          x={cx(i)}
                          y={base - h - 5}
                          textAnchor="middle"
                          className={`text-[11px] tabular-nums ${p.fuera ? 'fill-red-700 font-semibold dark:fill-red-400' : 'fill-slate-800 dark:fill-slate-100'}`}
                        >
                          {formato(p.valor)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        );
      })}
      {/* Eje X compartido: la fecha de cada análisis */}
      <div />
      <div className="flex border-t border-slate-300 pt-1 dark:border-slate-700">
        {categorias.map((c) => (
          <span key={c.key} className="min-w-0 flex-1 truncate text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Rectángulo con esquinas superiores redondeadas (4px) y base recta */
function columna(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

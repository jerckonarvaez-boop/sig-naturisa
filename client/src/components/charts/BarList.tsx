import { useState } from 'react';
import { useTip } from './Tooltip';

export interface BarListItem {
  key: string;
  label: string;
  valor: number;
  /** Texto adicional para el tooltip */
  detalle?: string;
}

interface BarListProps {
  items: BarListItem[];
  /** Formato corto para la etiqueta al final de la barra */
  formato: (v: number) => string;
  /** Formato completo para el tooltip */
  formatoLargo?: (v: number) => string;
  seleccion?: string | null;
  onSelect?: (key: string) => void;
  vacio?: string;
  /** Muestra solo las primeras N filas, con un botón "Ver todas" */
  limite?: number;
}

/** Barras horizontales ordenadas. Cada fila es un botón que puede usarse como filtro. */
export function BarList({ items, formato, formatoLargo = formato, seleccion, onSelect, vacio, limite }: BarListProps) {
  const tip = useTip();
  const [verTodas, setVerTodas] = useState(false);
  if (!items.length) return <SinDatos texto={vacio} />;
  const max = Math.max(...items.map((i) => i.valor), 1);

  const recortar = limite != null && !verTodas && items.length > limite;
  // La fila seleccionada se muestra siempre, aunque quede fuera del límite
  const visibles = recortar
    ? items.filter((item, i) => i < limite || item.key === seleccion)
    : items;

  return (
    <div>
      <div className="flex flex-col">
        {visibles.map((item) => {
          const activo = seleccion === item.key;
          const apagado = (seleccion != null && !activo) || item.valor === 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect?.(item.key)}
              aria-pressed={activo}
              {...tip({ valor: formatoLargo(item.valor), etiqueta: item.label, detalle: item.detalle })}
              className={`grid w-full grid-cols-[minmax(80px,36%)_1fr_auto] items-center gap-3 rounded-md px-2 py-1 text-left transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-chart-serie dark:hover:bg-slate-800 ${
                activo ? 'bg-sky-50 shadow-[inset_3px_0_0_var(--chart-serie)] dark:bg-sky-500/10' : ''
              }`}
            >
              <span className={`truncate text-[13px] ${apagado ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                {item.label}
              </span>
              <span className="h-2.5">
                {item.valor > 0 && (
                  <span
                    className={`block h-full rounded-r ${apagado ? 'bg-chart-apagado' : 'bg-chart-serie'}`}
                    style={{ width: `${Math.max((item.valor / max) * 100, 0.8)}%` }}
                  />
                )}
              </span>
              <span
                className={`min-w-14 text-right text-[13px] font-semibold tabular-nums ${apagado ? 'text-slate-400 dark:text-slate-500' : ''}`}
              >
                {formato(item.valor)}
              </span>
            </button>
          );
        })}
      </div>

      {limite != null && items.length > limite && (
        <button
          type="button"
          onClick={() => setVerTodas((v) => !v)}
          className="mt-1.5 ml-2 text-xs font-semibold text-brand-500 hover:underline"
        >
          {verTodas ? 'Ver menos' : `Ver todas (${items.length})`}
        </button>
      )}
    </div>
  );
}

export function SinDatos({ texto = 'Sin datos para este filtro' }: { texto?: string }) {
  return <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{texto}</p>;
}

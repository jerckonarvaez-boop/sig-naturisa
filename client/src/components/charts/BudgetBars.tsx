import { AlertTriangle } from 'lucide-react';
import { SinDatos } from './BarList';
import { useTip } from './Tooltip';

export interface BudgetBarItem {
  key: string;
  label: string;
  sublabel?: string;
  gasto: number;
  presupuesto: number;
}

interface BudgetBarsProps {
  items: BudgetBarItem[];
  formato: (v: number) => string;
  formatoLargo: (v: number) => string;
  porcentaje: (v: number) => string;
  seleccion?: string | null;
  onSelect?: (key: string) => void;
}

/**
 * Presupuesto vs. gasto, una fila por elemento: la pista clara es el presupuesto, la barra
 * azul lo gastado y el tramo rojo (separado por 2px) el exceso. Sin presupuesto: barra gris.
 */
export function BudgetBars({ items, formato, formatoLargo, porcentaje, seleccion, onSelect }: BudgetBarsProps) {
  const tip = useTip();
  if (!items.length) return <SinDatos />;
  const max = Math.max(1, ...items.map((i) => Math.max(i.presupuesto, i.gasto)));
  const ancho = (v: number) => `${((v / max) * 100).toFixed(2)}%`;

  return (
    <div>
      <Leyenda />
      <div className="flex flex-col">
        {items.map((item) => {
          const activo = seleccion === item.key;
          const apagado = seleccion != null && !activo;
          const exceso = item.presupuesto > 0 && item.gasto > item.presupuesto;
          const detalle = !item.presupuesto
            ? 'Sin presupuesto asignado'
            : exceso
              ? `Presupuesto ${formatoLargo(item.presupuesto)} · Exceso ${formatoLargo(item.gasto - item.presupuesto)}`
              : `${porcentaje(item.gasto / item.presupuesto)} de ${formatoLargo(item.presupuesto)}`;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect?.(item.key)}
              aria-pressed={activo}
              {...tip({ valor: formatoLargo(item.gasto), etiqueta: `${item.label} · gastado`, detalle })}
              className={`grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-md px-2 py-1.5 text-left transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-chart-serie sm:grid-cols-[minmax(160px,38%)_1fr_minmax(150px,auto)] sm:items-center dark:hover:bg-slate-800 ${
                activo ? 'bg-sky-50 shadow-[inset_3px_0_0_var(--chart-serie)] dark:bg-sky-500/10' : ''
              } ${apagado ? 'opacity-45' : ''}`}
            >
              <span className="truncate text-[13px]" title={item.label}>
                {item.label}
                {item.sublabel && <span className="text-xs text-slate-500 dark:text-slate-400"> · {item.sublabel}</span>}
              </span>

              <span className="relative col-span-2 row-start-2 block h-2.5 sm:col-span-1 sm:row-start-auto">
                {item.presupuesto > 0 ? (
                  <>
                    <span
                      className="absolute inset-y-0 left-0 rounded-r bg-chart-pista"
                      style={{ width: ancho(item.presupuesto) }}
                    />
                    <span
                      className={`absolute inset-y-0 left-0 bg-chart-serie ${exceso ? '' : 'rounded-r'}`}
                      style={{ width: ancho(Math.min(item.gasto, item.presupuesto)) }}
                    />
                    {exceso && (
                      <span
                        className="absolute inset-y-0 rounded-r bg-chart-exceso"
                        style={{
                          left: `calc(${ancho(item.presupuesto)} + 2px)`,
                          width: `max(2px, calc(${ancho(item.gasto - item.presupuesto)} - 2px))`,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <span className="absolute inset-y-0 left-0 rounded-r bg-chart-sin" style={{ width: ancho(item.gasto) }} />
                )}
              </span>

              <span className="text-right text-[13px] whitespace-nowrap tabular-nums">
                {item.presupuesto > 0 ? (
                  <>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${exceso ? 'text-red-600 dark:text-red-400' : ''}`}
                    >
                      {exceso && <AlertTriangle size={12} aria-label="Exceso" />}
                      {porcentaje(item.gasto / item.presupuesto)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {' '}· {formato(item.gasto)} de {formato(item.presupuesto)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{formato(item.gasto)}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400"> · sin presupuesto</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Leyenda() {
  const items = [
    ['bg-chart-serie', 'Gastado'],
    ['bg-chart-pista', 'Presupuesto'],
    ['bg-chart-exceso', 'Exceso'],
    ['bg-chart-sin', 'Sin presupuesto'],
  ];
  return (
    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      {items.map(([color, texto]) => (
        <span key={texto} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-3.5 rounded-sm ${color}`} />
          {texto}
        </span>
      ))}
    </div>
  );
}

import { useTip } from './Tooltip';
import { useElementWidth } from '@/hooks/useElementWidth';

export interface ColumnItem {
  key: string;
  label: string;
  valor: number;
  /** Opcional: si se indica, se dibuja como pista detrás de la columna */
  presupuesto?: number;
}

interface ColumnChartProps {
  items: ColumnItem[];
  formato: (v: number) => string;
  formatoLargo: (v: number) => string;
  /** Texto bajo cada etiqueta (ej. "120% de $29,7 mil") */
  subtexto?: (item: ColumnItem) => string | null;
  alto?: number;
  seleccion?: string | null;
  onSelect?: (key: string) => void;
  /** Texto del tooltip debajo del valor */
  detalleTip?: (item: ColumnItem) => string | undefined;
}

const COLUMNA = 24; // ancho máximo de columna (px)
const GAP = 2; // separación entre presupuesto y exceso

/**
 * Columnas verticales con el valor sobre cada una. Con `presupuesto`, la pista clara
 * marca el presupuesto y el tramo rojo (separado por 2px) el exceso.
 */
export function ColumnChart({
  items,
  formato,
  formatoLargo,
  subtexto,
  alto = 260,
  seleccion,
  onSelect,
  detalleTip,
}: ColumnChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const tip = useTip();

  const conSub = Boolean(subtexto);
  const margen = { top: 24, bottom: conSub ? 50 : 30 };
  const plotH = alto - margen.top - margen.bottom;
  const n = Math.max(items.length, 1);
  const maxDatos = Math.max(1, ...items.map((i) => Math.max(i.valor, i.presupuesto ?? 0)));

  // Si no caben todas las cifras, solo se rotula la columna más alta
  // y se añade un eje Y con valores redondos para leer el resto
  const rotularTodas = width / n >= 54;
  const ticks = rotularTodas ? [] : marcasEje(maxDatos);
  const max = ticks.length ? ticks[ticks.length - 1] : maxDatos;
  const izquierda = rotularTodas ? 0 : 44;
  const banda = (width - izquierda) / n;
  const y = (v: number) => margen.top + plotH * (1 - v / max);
  const base = margen.top + plotH;
  const compacto = banda < 60;
  // Columna de máx. 24px y siempre con aire entre columnas vecinas
  const ancho = Math.max(4, Math.min(COLUMNA, banda * 0.7));
  const mayor = items.reduce((m, i) => (i.valor > m ? i.valor : m), 0);

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={alto} className="block overflow-visible" role="img" aria-label="Gráfico de columnas">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={izquierda} x2={width} y1={y(t)} y2={y(t)} className="stroke-chart-rejilla" strokeWidth={1} />
              <text x={izquierda - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums dark:fill-slate-400">
                {formato(t)}
              </text>
            </g>
          ))}
          <line x1={izquierda} x2={width} y1={base} y2={base} className="stroke-chart-rejilla" strokeWidth={1} />
          {items.map((item, i) => {
            const cx = izquierda + banda * i + banda / 2;
            const x = cx - ancho / 2;
            const apagado = seleccion != null && seleccion !== item.key;
            const pres = item.presupuesto ?? 0;
            const exceso = pres > 0 && item.valor > pres;
            const azul = exceso ? pres : item.valor;
            const sub = subtexto?.(item);

            return (
              <g
                key={item.key}
                tabIndex={0}
                role="button"
                aria-label={`${item.label}: ${formatoLargo(item.valor)}`}
                className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:fill-slate-200/40"
                onClick={() => onSelect?.(item.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(item.key);
                  }
                }}
                {...tip({ valor: formatoLargo(item.valor), etiqueta: item.label, detalle: detalleTip?.(item) })}
              >
                {/* área de clic: toda la banda */}
                <rect x={cx - banda / 2} y={0} width={banda} height={alto} fill="transparent" />

                {pres > 0 && (
                  <path d={columnaPath(x, y(pres), ancho, base - y(pres))} className="fill-chart-pista" />
                )}
                {azul > 0 && (
                  <path
                    d={columnaPath(x, y(azul), ancho, base - y(azul), !exceso)}
                    className={apagado ? 'fill-chart-apagado' : 'fill-chart-serie'}
                  />
                )}
                {exceso && (
                  <path
                    d={columnaPath(x, y(item.valor), ancho, Math.max(y(pres) - y(item.valor) - GAP, 1))}
                    className={apagado ? 'fill-chart-apagado' : 'fill-chart-exceso'}
                  />
                )}

                {item.valor > 0 && (rotularTodas || item.valor === mayor) && (
                  <text
                    x={cx}
                    y={Math.min(y(item.valor), pres ? y(pres) : Infinity) - 7}
                    textAnchor="middle"
                    className={`text-xs font-semibold tabular-nums ${apagado ? 'fill-slate-400' : 'fill-slate-800 dark:fill-slate-100'}`}
                  >
                    {formato(item.valor)}
                  </text>
                )}

                <text
                  x={cx}
                  y={base + 17}
                  textAnchor="middle"
                  className={`text-xs font-medium ${apagado ? 'fill-slate-400' : 'fill-slate-700 dark:fill-slate-200'}`}
                >
                  {compacto ? item.label.slice(0, 3) : recortar(item.label, Math.floor(banda / 7))}
                </text>
                {sub && (
                  <text
                    x={cx}
                    y={base + 34}
                    textAnchor="middle"
                    className={`text-[11px] ${exceso ? 'fill-red-600 dark:fill-red-400' : 'fill-slate-500 dark:fill-slate-400'}`}
                  >
                    {sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** Rectángulo con esquinas superiores redondeadas (4px) y base recta. */
function columnaPath(x: number, y: number, w: number, h: number, redondeado = true) {
  if (h <= 0) return '';
  const r = redondeado ? Math.min(4, h, w / 2) : 0;
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/** 3-5 valores redondos para el eje Y (ej. 5.000, 10.000, 15.000, 20.000, 25.000) */
function marcasEje(max: number): number[] {
  const bruto = max / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto) ?? 10 * potencia;
  const marcas: number[] = [];
  for (let v = paso; v < max + paso; v += paso) marcas.push(v);
  return marcas;
}

function recortar(texto: string, max: number) {
  return texto.length > max ? `${texto.slice(0, Math.max(max - 1, 3))}…` : texto;
}

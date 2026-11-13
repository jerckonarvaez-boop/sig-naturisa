import { useId } from 'react';
import { useTip } from './Tooltip';
import { useElementWidth } from '@/hooks/useElementWidth';

/** Una muestra suelta de la fecha (se dibuja como punto pequeño alrededor del promedio) */
export interface AreaMuestra {
  key: string;
  label: string;
  valor: number;
  detalle?: string;
  fuera?: boolean;
}

export interface AreaPunto {
  key: string;
  label: string;
  /** Posición en el eje X, de 0 (inicio) a 1 (fin) */
  x: number;
  valor: number;
  /** Texto del tooltip debajo del valor */
  detalle?: string;
  /** Fuera de la referencia: el punto se dibuja en rojo (el tooltip lo dice con texto) */
  fuera?: boolean;
  /** Muestras que forman el punto, cuando son varias */
  muestras?: AreaMuestra[];
}

interface AreaChartProps {
  puntos: AreaPunto[];
  /** Marcas del eje X (posición 0–1 y rótulo) */
  ticksX: { x: number; label: string }[];
  formato: (v: number) => string;
  formatoLargo: (v: number) => string;
  alto?: number;
  /** Rango de referencia: líneas punteadas rotuladas */
  min?: number;
  max?: number;
  /** Versión pequeña (varias juntas): menos rótulos en los ejes */
  compacto?: boolean;
  /** Separación en X a partir de la cual la línea se corta (no une períodos sin datos) */
  corte?: number;
}

/**
 * Línea con puntos y área sombreada: la tendencia de un valor en el tiempo, con cada muestra como punto pequeño.
 * La línea se corta donde no hay datos; el eje Y se ajusta a los valores (no parte de cero) para que se note el cambio.
 */
export function AreaChart({ puntos, ticksX, formato, formatoLargo, alto = 220, min, max, compacto = false, corte = Infinity }: AreaChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const tip = useTip();
  const id = useId();

  const margen = { top: 14, bottom: 24, left: compacto ? 34 : 44, right: 10 };
  const plotW = Math.max(width - margen.left - margen.right, 1);
  const plotH = alto - margen.top - margen.bottom;
  const base = margen.top + plotH;

  // Escala Y: todas las muestras y la referencia, con marcas redondas
  const todos = [...puntos.flatMap((p) => [p.valor, ...(p.muestras ?? []).map((m) => m.valor)]), ...(min != null ? [min] : []), ...(max != null ? [max] : [])];
  const ticks = marcas(todos.length ? Math.min(...todos) : 0, todos.length ? Math.max(...todos) : 1, compacto ? 3 : 4);
  const y0 = ticks[0];
  const y1 = ticks[ticks.length - 1];
  const y = (v: number) => margen.top + plotH * (1 - (v - y0) / (y1 - y0 || 1));
  const x = (t: number) => margen.left + plotW * t;

  // Tramos seguidos (la línea no une períodos sin muestras)
  const tramos: { x: number; y: number }[][] = [];
  puntos.forEach((p, i) => {
    if (i === 0 || p.x - puntos[i - 1].x > corte) tramos.push([]);
    tramos[tramos.length - 1].push({ x: x(p.x), y: y(p.valor) });
  });

  const muchos = puntos.length > 40;
  const radio = muchos ? 2.5 : compacto ? 3 : 4;
  const radioMuestra = compacto ? 1.5 : 2;
  const ticksVisibles = ticksX.filter((_, i) => i % Math.max(1, Math.ceil(ticksX.length / Math.max(1, Math.floor(plotW / (compacto ? 34 : 48))))) === 0);

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={alto} className="block overflow-visible" role="img" aria-label="Gráfico de línea con área">
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-serie)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-serie)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={margen.left} x2={width - margen.right} y1={y(t)} y2={y(t)} className="stroke-chart-rejilla" strokeWidth={1} />
              <text x={margen.left - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums dark:fill-slate-400">
                {formato(t)}
              </text>
            </g>
          ))}
          {ticksVisibles.map((t) => (
            <text key={t.label} x={x(t.x)} y={base + 16} textAnchor="middle" className="fill-slate-600 text-[11px] dark:fill-slate-300">
              {t.label}
            </text>
          ))}
          {[min, max].map(
            (r, i) =>
              r != null && (
                <g key={i}>
                  <line x1={margen.left} x2={width - margen.right} y1={y(r)} y2={y(r)} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={1} strokeDasharray="4 3" />
                  {!compacto && (
                    <text x={width - margen.right} y={y(r) - 4} textAnchor="end" className="fill-slate-500 text-[10px] dark:fill-slate-400">
                      {i === 0 ? 'ref. mín.' : 'ref. máx.'} {formato(r)}
                    </text>
                  )}
                </g>
              ),
          )}
          {tramos.map(
            (t, i) =>
              t.length > 1 && (
                <g key={i}>
                  <path d={`${curva(t)} L${t[t.length - 1].x},${base} L${t[0].x},${base} Z`} fill={`url(#${id})`} />
                  <path d={curva(t)} fill="none" className="stroke-chart-serie" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </g>
              ),
          )}
          {/* Franja sensible de cada fecha: promedio y resumen */}
          {puntos.map((p, i) => {
            const izq = i === 0 ? margen.left : (x(puntos[i - 1].x) + x(p.x)) / 2;
            const der = i === puntos.length - 1 ? width - margen.right : (x(p.x) + x(puntos[i + 1].x)) / 2;
            return (
              <g
                key={p.key}
                tabIndex={0}
                role="img"
                aria-label={`${p.label}: ${formatoLargo(p.valor)}${p.fuera ? ' (fuera de la referencia)' : ''}`}
                className="outline-none [&:focus-visible>circle]:stroke-slate-900 [&:hover>circle]:[r:6] dark:[&:focus-visible>circle]:stroke-white"
                {...tip({ valor: formatoLargo(p.valor), etiqueta: p.label, detalle: p.detalle })}
              >
                <rect x={izq} y={margen.top} width={Math.max(der - izq, 1)} height={plotH} fill="transparent" />
                <circle
                  cx={x(p.x)}
                  cy={y(p.valor)}
                  r={radio}
                  strokeWidth={muchos ? 1 : 2}
                  className={`stroke-white dark:stroke-slate-900 ${p.fuera ? 'fill-chart-exceso' : 'fill-chart-serie'}`}
                />
              </g>
            );
          })}
          {/* Cada muestra, encima de las franjas para poder señalarla */}
          {puntos.flatMap((p) =>
            (p.muestras ?? []).map((m) => (
              <circle
                key={`${p.key}-${m.key}`}
                cx={x(p.x)}
                cy={y(m.valor)}
                r={radioMuestra}
                fillOpacity={0.45}
                className={`hover:[r:5] hover:[fill-opacity:1] ${m.fuera ? 'fill-chart-exceso' : 'fill-chart-serie'}`}
                {...tip({ valor: formatoLargo(m.valor), etiqueta: m.label, detalle: m.detalle })}
              />
            )),
          )}
        </svg>
      )}
    </div>
  );
}

/** Curva suave que pasa por todos los puntos sin pasarse de ellos (interpolación cúbica monótona) */
function curva(p: { x: number; y: number }[]): string {
  const n = p.length;
  if (n === 2) return `M${p[0].x},${p[0].y} L${p[1].x},${p[1].y}`;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1].y - p[i].y) / (p[i + 1].x - p[i].x || 1));
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let ruta = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = (p[i + 1].x - p[i].x) / 3;
    ruta += ` C${p[i].x + h},${p[i].y + m[i] * h} ${p[i + 1].x - h},${p[i + 1].y - m[i + 1] * h} ${p[i + 1].x},${p[i + 1].y}`;
  }
  return ruta;
}

/** Marcas redondas del eje Y que cubren [min, max] (ej. 7 · 7,5 · 8 · 8,5) */
function marcas(min: number, max: number, cuantas: number): number[] {
  if (min === max) {
    min = min === 0 ? 0 : min - Math.abs(min) * 0.1;
    max = max === 0 ? 1 : max + Math.abs(max) * 0.1;
  }
  const bruto = (max - min) / cuantas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((k) => k * potencia).find((p) => p >= bruto) ?? 10 * potencia;
  const inicio = Math.floor(min / paso) * paso;
  const lista: number[] = [];
  for (let v = inicio; v < max + paso * 0.999; v += paso) lista.push(Number(v.toPrecision(12)));
  return lista;
}

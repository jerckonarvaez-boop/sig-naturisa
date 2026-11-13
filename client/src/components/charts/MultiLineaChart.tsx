import { useState } from 'react';
import { useTip } from './Tooltip';
import { useElementWidth } from '@/hooks/useElementWidth';

export interface SerieLinea {
  key: string;
  label: string;
  /** Clase que define el color de la serie en la variable --serie (con su tono para el tema oscuro) */
  clase: string;
  unidad?: string;
  puntos: { categoria: string; valor: number; titulo: string; detalle?: string; fuera?: boolean }[];
}

interface MultiLineaChartProps {
  /** Posiciones del eje X, en orden (ej. cada análisis de una piscina) */
  categorias: { key: string; label: string }[];
  series: SerieLinea[];
  formato: (v: number) => string;
  alto?: number;
}

const SERIE = 'var(--serie, var(--chart-serie))';
const EJE = 46;
const DERECHA = 112; // nombre de cada serie al final de su línea

/**
 * Varias series en un mismo gráfico de líneas, con un solo eje Y. Si los valores son de magnitudes muy distintas
 * (0,02 de nitrito y 900 de magnesio) el eje es logarítmico, para que todas las líneas se distingan.
 * Cada serie se puede ocultar desde la leyenda.
 */
export function MultiLineaChart({ categorias, series, formato, alto = 440 }: MultiLineaChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const tip = useTip();
  const [ocultas, setOcultas] = useState<string[]>([]);
  const visibles = series.filter((s) => !ocultas.includes(s.key));

  const top = 22;
  const pie = 30;
  const plotH = alto - top - pie;
  const plotW = Math.max(width - EJE - DERECHA, 1);
  const n = categorias.length;
  const xDe = new Map(categorias.map((c, i) => [c.key, EJE + (n > 1 ? (plotW * i) / (n - 1) : plotW / 2)]));

  const valores = visibles.flatMap((s) => s.puntos.map((p) => p.valor));
  const positivos = valores.filter((v) => v > 0);
  const maximo = valores.length ? Math.max(...valores) : 1;
  const minimoPositivo = positivos.length ? Math.min(...positivos) : 1;
  const logaritmico = positivos.length > 0 && maximo / minimoPositivo > 50;
  // Eje logarítmico: de la potencia de 10 bajo el menor valor a la que está sobre el mayor; el 0 se dibuja en el piso
  const piso = 10 ** Math.floor(Math.log10(minimoPositivo));
  const techo = 10 ** Math.ceil(Math.log10(Math.max(maximo, piso * 10)));
  const ticks = logaritmico ? potencias(piso, techo) : marcas(0, maximo, 5);
  const y0 = ticks[0];
  const y1 = ticks[ticks.length - 1];
  const y = (v: number) => {
    const t = logaritmico ? (Math.log10(Math.max(v, piso)) - Math.log10(y0)) / (Math.log10(y1) - Math.log10(y0) || 1) : (v - y0) / (y1 - y0 || 1);
    return top + plotH * (1 - Math.min(1, Math.max(0, t)));
  };

  const trazos = visibles.map((s) => {
    const pts = s.puntos.filter((p) => xDe.has(p.categoria)).map((p) => ({ ...p, x: xDe.get(p.categoria)!, y: y(p.valor) }));
    pts.sort((a, b) => a.x - b.x);
    return { serie: s, pts };
  });
  // Nombre de cada serie al final de su línea, sin que se pisen
  const finales = trazos
    .filter((t) => t.pts.length)
    .map((t) => ({ key: t.serie.key, label: t.serie.label, clase: t.serie.clase, x: t.pts[t.pts.length - 1].x, y: t.pts[t.pts.length - 1].y, yLabel: t.pts[t.pts.length - 1].y }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < finales.length; i++) finales[i].yLabel = Math.max(finales[i].yLabel, finales[i - 1].yLabel + 13);

  return (
    <div ref={ref} className="w-full">
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Series del gráfico">
        {series.map((s) => {
          const visible = !ocultas.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={visible}
              title={visible ? 'Ocultar del gráfico' : 'Mostrar en el gráfico'}
              onClick={() => setOcultas(visible ? [...ocultas, s.key] : ocultas.filter((k) => k !== s.key))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.clase} ${
                visible ? 'border-slate-300 dark:border-slate-600' : 'border-slate-200 text-slate-400 line-through dark:border-slate-800 dark:text-slate-500'
              }`}
            >
              <span className="size-2.5 rounded-full" style={{ background: visible ? SERIE : 'transparent', border: `1.5px solid ${SERIE}` }} aria-hidden="true" />
              {s.label}
            </button>
          );
        })}
      </div>
      {width > 0 && (
        <svg width={width} height={alto} className="block" role="img" aria-label="Gráfico de líneas con todas las series">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={EJE} x2={EJE + plotW} y1={y(t)} y2={y(t)} className="stroke-chart-rejilla" strokeWidth={1} />
              <text x={EJE - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums dark:fill-slate-400">
                {formato(t)}
              </text>
            </g>
          ))}
          {categorias.map((c) => (
            <text key={c.key} x={xDe.get(c.key)} y={alto - 10} textAnchor="middle" className="fill-slate-600 text-[11px] dark:fill-slate-300">
              {c.label}
            </text>
          ))}
          {trazos.map(({ serie, pts }) => (
            <g key={serie.key} className={serie.clase}>
              {pts.length > 1 && <path d={curva(pts)} fill="none" stroke={SERIE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
              {pts.map((p, i) => (
                <g
                  key={i}
                  tabIndex={0}
                  role="img"
                  aria-label={`${serie.label}, ${p.titulo}: ${formato(p.valor)} ${serie.unidad ?? ''}${p.fuera ? ' (fuera de la referencia)' : ''}`}
                  className="outline-none [&:focus-visible>circle]:stroke-slate-900 [&:hover>circle]:[r:6] dark:[&:focus-visible>circle]:stroke-white"
                  {...tip({ valor: `${formato(p.valor)} ${serie.unidad ?? ''}`.trim(), etiqueta: `${serie.label} · ${p.titulo}`, detalle: p.detalle })}
                >
                  <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
                  <circle cx={p.x} cy={p.y} r={4} strokeWidth={2} style={p.fuera ? undefined : { fill: SERIE }} className={`stroke-white dark:stroke-slate-900 ${p.fuera ? 'fill-chart-exceso' : ''}`} />
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className={`text-[10px] tabular-nums ${p.fuera ? 'fill-red-700 font-semibold dark:fill-red-400' : 'fill-slate-800 dark:fill-slate-100'}`}
                  >
                    {formato(p.valor)}
                  </text>
                </g>
              ))}
            </g>
          ))}
          {finales.map((f) => (
            <g key={f.key} className={f.clase}>
              <line x1={f.x + 7} x2={f.x + 16} y1={f.y} y2={f.yLabel} stroke={SERIE} strokeWidth={1} />
              <text x={f.x + 19} y={f.yLabel + 4} className="fill-slate-700 text-[11px] font-semibold dark:fill-slate-200">
                {f.label.length > 15 ? `${f.label.slice(0, 14)}…` : f.label}
              </text>
            </g>
          ))}
        </svg>
      )}
      {logaritmico && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Eje en escala logarítmica (cada línea horizontal es 10 veces la anterior), para ver juntos valores muy pequeños y muy grandes.</p>}
    </div>
  );
}

function potencias(desde: number, hasta: number): number[] {
  const lista: number[] = [];
  for (let v = desde; v <= hasta * 1.0001; v *= 10) lista.push(Number(v.toPrecision(6)));
  return lista;
}

/** Marcas redondas del eje Y que cubren [min, max] */
function marcas(min: number, max: number, cuantas: number): number[] {
  if (min === max) max = max === 0 ? 1 : max * 1.1;
  const bruto = (max - min) / cuantas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((k) => k * potencia).find((p) => p >= bruto) ?? 10 * potencia;
  const lista: number[] = [];
  for (let v = Math.floor(min / paso) * paso; v < max + paso * 0.999; v += paso) lista.push(Number(v.toPrecision(12)));
  return lista;
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

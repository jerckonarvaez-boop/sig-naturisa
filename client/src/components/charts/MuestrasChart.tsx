import { useId } from 'react';
import { useTip } from './Tooltip';
import { useElementWidth } from '@/hooks/useElementWidth';

export interface MuestraItem {
  key: string;
  /** Rótulo bajo el punto (la piscina o la fecha) */
  label: string;
  /** Grupo al que pertenece (la fecha o la piscina): se rotula una vez, bajo sus muestras */
  grupo: string;
  valor: number;
  /** Título y detalle del tooltip */
  titulo: string;
  detalle?: string;
  /** Fuera de la referencia: el punto se dibuja en rojo (el tooltip lo dice con texto) */
  fuera?: boolean;
}

interface MuestrasChartProps {
  items: MuestraItem[];
  formato: (v: number) => string;
  formatoLargo: (v: number) => string;
  alto?: number;
  /** Rango de referencia: líneas punteadas */
  min?: number;
  max?: number;
  /** Escala Y [mín, máx]: los valores que se salen se dibujan en el borde, con un anillo */
  rango?: [number, number];
}

const PASO = 40; // ancho mínimo por muestra (px): si no caben, el gráfico se desplaza a los lados
const EJE = 46; // ancho del eje Y, que queda fijo al desplazar
const SANGRIA = 22; // aire a la izquierda para el rótulo inclinado de la primera muestra
const PIE = 80;
/** Color de la serie: el del parámetro (variable --serie en un contenedor) o el general de los gráficos */
const SERIE = 'var(--serie, var(--chart-serie))'; // rótulos de las muestras (inclinados) y de los grupos

/**
 * Una muestra por posición en el eje X (con su rótulo) y su valor en el eje Y: línea con puntos y área.
 * Con muchas muestras el gráfico se hace más ancho y se desplaza a los lados; el eje Y queda fijo.
 */
export function MuestrasChart({ items, formato, formatoLargo, alto = 360, min, max, rango }: MuestrasChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const tip = useTip();
  const id = useId();

  const top = 26; // aire para el valor sobre el punto más alto
  const plotH = alto - top - PIE;
  const base = top + plotH;
  const visible = Math.max(width - EJE - SANGRIA, 1);
  const paso = Math.max(PASO, visible / Math.max(items.length, 1));
  const ancho = SANGRIA + Math.max(visible, paso * items.length);
  const x = (i: number) => SANGRIA + paso * (i + 0.5);

  const valores = rango ?? items.map((i) => i.valor);
  // La referencia entra en la escala solo si queda cerca de los valores (si no, los aplastaría)
  const amplitud = valores.length ? Math.max(...valores) - Math.min(...valores) || Math.abs(valores[0]) || 1 : 1;
  const cerca = (r?: number) => (r != null && valores.length && r >= Math.min(...valores) - amplitud && r <= Math.max(...valores) + amplitud ? [r] : []);
  const todos = [...valores, ...cerca(min), ...cerca(max)];
  const ticks = marcas(todos.length ? Math.min(...todos) : 0, todos.length ? Math.max(...todos) : 1, 4);
  const y0 = ticks[0];
  const y1 = ticks[ticks.length - 1];
  const y = (v: number) => top + plotH * (1 - (Math.min(y1, Math.max(y0, v)) - y0) / (y1 - y0 || 1));
  const seSale = (v: number) => v < y0 || v > y1;

  const linea = curva(items.map((it, i) => ({ x: x(i), y: y(it.valor) })));
  // Grupos seguidos (misma fecha o misma piscina)
  const grupos: { label: string; desde: number; hasta: number }[] = [];
  items.forEach((it, i) => {
    const g = grupos[grupos.length - 1];
    if (g && g.label === it.grupo) g.hasta = i;
    else grupos.push({ label: it.grupo, desde: i, hasta: i });
  });
  // Rótulo de grupo: al inicio de su corchete (así se ve aunque el grupo sea más ancho que la pantalla), si no pisa al anterior
  let libre = -Infinity;
  const rotulos = grupos.map((g) => {
    const inicio = x(g.desde) - paso / 2 + 5;
    const cabe = Boolean(g.label) && inicio > libre;
    if (cabe) libre = inicio + g.label.length * 6.8 + 8;
    return cabe;
  });

  return (
    <div ref={ref} className="flex w-full">
      {width > 0 && (
        <>
          <svg width={EJE} height={alto} className="block shrink-0" aria-hidden="true">
            {ticks.map((t) => (
              <text key={t} x={EJE - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums dark:fill-slate-400">
                {formato(t)}
              </text>
            ))}
          </svg>
          <div className="min-w-0 flex-1 overflow-x-auto pb-1 dark:[color-scheme:dark]">
            <svg width={ancho} height={alto} className="block" role="img" aria-label="Gráfico de línea con una muestra por posición">
              <defs>
                <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={SERIE} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={SERIE} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              {ticks.map((t) => (
                <line key={t} x1={0} x2={ancho} y1={y(t)} y2={y(t)} className="stroke-chart-rejilla" strokeWidth={1} />
              ))}
              {/* separación entre grupos */}
              {grupos.slice(1).map((g) => (
                <line key={g.desde} x1={SANGRIA + paso * g.desde} x2={SANGRIA + paso * g.desde} y1={top} y2={base} className="stroke-chart-rejilla" strokeWidth={1} />
              ))}
              {[min, max].map(
                (r, i) =>
                  r != null &&
                  !seSale(r) && (
                    <g key={i}>
                      <line x1={0} x2={ancho} y1={y(r)} y2={y(r)} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={1} strokeDasharray="4 3" />
                      <text x={4} y={y(r) - 4} className="fill-slate-500 text-[10px] dark:fill-slate-400">
                        {i === 0 ? 'ref. mín.' : 'ref. máx.'} {formato(r)}
                      </text>
                    </g>
                  ),
              )}
              {items.length > 1 && (
                <>
                  <path d={`${linea} L${x(items.length - 1)},${base} L${x(0)},${base} Z`} fill={`url(#${id})`} />
                  <path d={linea} fill="none" stroke={SERIE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </>
              )}
              {items.map((it, i) => (
                <g
                  key={it.key}
                  tabIndex={0}
                  role="img"
                  aria-label={`${it.titulo}: ${formatoLargo(it.valor)}${it.fuera ? ' (fuera de la referencia)' : ''}`}
                  className="outline-none [&:focus-visible>circle]:stroke-slate-900 [&:hover>circle]:[r:6] dark:[&:focus-visible>circle]:stroke-white"
                  {...tip({ valor: formatoLargo(it.valor), etiqueta: it.titulo, detalle: it.detalle })}
                >
                  <rect x={SANGRIA + paso * i} y={top} width={paso} height={alto - top} fill="transparent" />
                  <circle
                    cx={x(i)}
                    cy={y(it.valor)}
                    r={4}
                    strokeWidth={2}
                    style={seSale(it.valor) || it.fuera ? undefined : { fill: SERIE }}
                    className={seSale(it.valor) ? 'fill-white stroke-chart-exceso dark:fill-slate-900' : `stroke-white dark:stroke-slate-900 ${it.fuera ? 'fill-chart-exceso' : 'fill-chart-serie'}`}
                  />
                  {/* el valor, sobre el punto (o debajo si no cabe arriba) */}
                  <text
                    x={x(i)}
                    y={y(it.valor) - 9 < 10 ? y(it.valor) + 17 : y(it.valor) - 9}
                    textAnchor="middle"
                    className={`text-[10px] tabular-nums ${it.fuera ? 'fill-red-700 font-semibold dark:fill-red-400' : 'fill-slate-800 dark:fill-slate-100'}`}
                  >
                    {formato(it.valor)}
                  </text>
                  <text
                    x={x(i)}
                    y={base + 10}
                    textAnchor="end"
                    transform={`rotate(-55 ${x(i)} ${base + 10})`}
                    className={`text-[10px] ${it.fuera ? 'fill-red-700 font-semibold dark:fill-red-400' : 'fill-slate-700 dark:fill-slate-200'}`}
                  >
                    {it.label.length > 9 ? `${it.label.slice(0, 8)}…` : it.label}
                  </text>
                </g>
              ))}
              {grupos.map(
                (g, i) =>
                  g.label && (
                    <g key={g.desde}>
                      {/* corchete que engloba las muestras del grupo */}
                      <path
                        d={`M${x(g.desde) - paso / 2 + 5},${alto - 26} v5 H${x(g.hasta) + paso / 2 - 5} v-5`}
                        fill="none"
                        className="stroke-slate-400 dark:stroke-slate-500"
                        strokeWidth={1.5}
                      />
                      {rotulos[i] && (
                        <text x={x(g.desde) - paso / 2 + 5} y={alto - 6} className="fill-slate-700 text-[11px] font-semibold dark:fill-slate-200">
                          {g.label}
                        </text>
                      )}
                    </g>
                  ),
              )}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

/** Curva suave que pasa por todos los puntos sin pasarse de ellos (interpolación cúbica monótona) */
function curva(p: { x: number; y: number }[]): string {
  const n = p.length;
  if (n < 2) return '';
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

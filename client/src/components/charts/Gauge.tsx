interface GaugeProps {
  /** Fracción ejecutada (0 a 1; mayor a 1 = sobregiro) */
  fraccion: number;
  /** Texto central (ej. "88%") */
  valor: string;
  /** Texto bajo el valor central (ej. "ejecutado") */
  etiqueta: string;
  minLabel: string;
  maxLabel: string;
}

/** Medidor semicircular: pista clara + arco de avance (rojo si supera el 100%). */
export function Gauge({ fraccion, valor, etiqueta, minLabel, maxLabel }: GaugeProps) {
  const W = 220;
  const H = 128;
  const cx = W / 2;
  const cy = 104;
  const r = 86;
  const grosor = 18;
  const lleno = Math.min(Math.max(fraccion, 0), 1);
  const sobregiro = fraccion > 1;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${valor} ${etiqueta}`} className="mx-auto block">
      <path d={arco(cx, cy, r, 180, 0)} className="stroke-chart-pista" strokeWidth={grosor} fill="none" />
      {lleno > 0 && (
        <path
          d={arco(cx, cy, r, 180, 180 - 180 * lleno)}
          className={sobregiro ? 'stroke-chart-exceso' : 'stroke-chart-serie'}
          strokeWidth={grosor}
          fill="none"
        />
      )}
      <text x={cx} y={cy - 14} textAnchor="middle" className="fill-slate-800 text-[28px] font-semibold dark:fill-slate-100">
        {valor}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" className="fill-slate-500 text-sm dark:fill-slate-400">
        {etiqueta}
      </text>
      <text x={cx - r} y={cy + 18} textAnchor="middle" className="fill-slate-500 text-xs dark:fill-slate-400">
        {minLabel}
      </text>
      <text x={cx + r} y={cy + 18} textAnchor="middle" className="fill-slate-500 text-xs dark:fill-slate-400">
        {maxLabel}
      </text>
    </svg>
  );
}

function arco(cx: number, cy: number, r: number, a0: number, a1: number) {
  const punto = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = punto(a0);
  const [x1, y1] = punto(a1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

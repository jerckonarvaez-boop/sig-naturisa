import { cumplimiento, nivel, NIVELES, type Conteo } from '../logic/calculo';

/** Porcentaje de cumplimiento con barra (color según nivel; el % siempre va en texto). */
export function BarraCumplimiento({ conteo, compacta = false }: { conteo: Conteo; compacta?: boolean }) {
  const fraccion = cumplimiento(conteo);
  if (fraccion == null) {
    return <span className="text-xs text-slate-400">{conteo.na === conteo.total && conteo.total ? 'N/A' : '—'}</span>;
  }
  const n = NIVELES[nivel(fraccion)];
  return (
    <span className="flex items-center gap-2" title={`${conteo.si} SI · ${conteo.no} NO · ${conteo.na} N/A · nivel ${n.label.toLowerCase()}`}>
      <span className={`h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${compacta ? 'w-10' : 'w-full min-w-16'}`}>
        <span className={`block h-full rounded-full ${n.barra}`} style={{ width: `${fraccion * 100}%` }} />
      </span>
      <span className={`text-xs font-semibold tabular-nums ${n.texto}`}>{Math.round(fraccion * 100)}%</span>
    </span>
  );
}

/** Porcentaje grande para el resumen */
export function PorcentajeGrande({ conteo }: { conteo: Conteo }) {
  const fraccion = cumplimiento(conteo);
  if (fraccion == null) return <p className="text-4xl font-semibold text-slate-400">—</p>;
  const n = NIVELES[nivel(fraccion)];
  return (
    <p className="flex items-baseline gap-2">
      <span className={`text-5xl font-semibold tracking-tight ${n.texto}`}>{Math.round(fraccion * 100)}%</span>
      <span className={`text-sm font-semibold ${n.texto}`}>{n.label}</span>
    </p>
  );
}

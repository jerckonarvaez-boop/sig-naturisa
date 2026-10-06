import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/Card';
import { Gauge } from '@/components/charts/Gauge';
import { dinero, dineroCorto, miles, porcentaje } from '../formato';

interface KpiPresupuestoProps {
  titulo: string;
  subtitulo: string;
  gasto: number;
  presupuesto: number;
  registros: number;
  proyeccion: number;
}

/** Tarjeta principal: lo gastado frente al presupuesto vigente. */
export function KpiPresupuesto({ titulo, subtitulo, gasto, presupuesto, registros, proyeccion }: KpiPresupuestoProps) {
  const disponible = presupuesto - gasto;
  const ejecutado = presupuesto ? gasto / presupuesto : NaN;
  const proyeccionExcede = presupuesto > 0 && proyeccion > presupuesto;

  return (
    <Card compact title={titulo} subtitle={subtitulo} className="flex flex-col">
      <div className="text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">Gastado</p>
        <p className="text-5xl leading-tight font-semibold tracking-tight">{dineroCorto(gasto)}</p>
      </div>

      <div className="mt-1">
        <Gauge
          fraccion={presupuesto ? gasto / presupuesto : 0}
          valor={porcentaje(ejecutado)}
          etiqueta="ejecutado"
          minLabel="$0"
          maxLabel={dineroCorto(presupuesto)}
        />
      </div>

      <div className="mt-1 flex justify-center">
        {!presupuesto ? (
          <Estado tipo="mal" texto="Sin presupuesto asignado" />
        ) : disponible >= 0 ? (
          <Estado tipo="ok" texto={`Disponible ${dinero(disponible)}`} />
        ) : (
          <Estado tipo="mal" texto={`Sobregirado ${dinero(-disponible)}`} />
        )}
      </div>

      <dl className="mt-3 grid grid-cols-3 border-t border-slate-200 pt-3 text-center dark:border-slate-800">
        <Dato valor={dineroCorto(presupuesto)} etiqueta="presupuesto" />
        <Dato valor={miles(registros)} etiqueta="registros" />
        <Dato
          valor={Number.isFinite(proyeccion) ? dineroCorto(proyeccion) : '—'}
          etiqueta="proyección al cierre"
          alerta={proyeccionExcede}
          titulo="Gasto al ritmo promedio mensual, llevado a 12 meses"
        />
      </dl>
    </Card>
  );
}

function Estado({ tipo, texto }: { tipo: 'ok' | 'mal'; texto: string }) {
  const Icono = tipo === 'ok' ? CheckCircle2 : AlertTriangle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[13px] font-semibold ${
        tipo === 'ok'
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
      }`}
    >
      <Icono size={15} />
      {texto}
    </span>
  );
}

function Dato({ valor, etiqueta, alerta, titulo }: { valor: string; etiqueta: string; alerta?: boolean; titulo?: string }) {
  return (
    <div title={titulo}>
      <dd className={`flex items-center justify-center gap-1 text-base font-semibold ${alerta ? 'text-red-600 dark:text-red-400' : ''}`}>
        {alerta && <AlertTriangle size={14} aria-label="Supera el presupuesto" />}
        {valor}
      </dd>
      <dt className="text-xs leading-tight text-slate-500 dark:text-slate-400">{etiqueta}</dt>
    </div>
  );
}

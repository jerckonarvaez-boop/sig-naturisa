import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface SeccionTableroProps {
  titulo: string;
  icono: LucideIcon;
  /** Sección del sistema a la que lleva "Ver sección" */
  ruta: string;
  /** Cifras principales (una fila de Cifra) */
  cifras?: ReactNode;
  children: ReactNode;
  /** Ocupa todo el ancho en pantallas grandes (las cifras caben en una fila) */
  ancha?: boolean;
  /** Filtros propios de la sección, debajo del título */
  filtros?: ReactNode;
}

/** Tarjeta de una sección del Dashboard: título con enlace, cifras clave y sus gráficos */
export function SeccionTablero({ titulo, icono: Icono, ruta, cifras, children, ancha = false, filtros }: SeccionTableroProps) {
  return (
    <Card className={`flex min-w-0 flex-col ${ancha ? 'xl:col-span-2' : ''}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icono size={20} className="text-brand-500" aria-hidden />
          {titulo}
        </h2>
        <Link to={ruta} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-500 hover:underline">
          Ver sección <ArrowRight size={14} />
        </Link>
      </div>
      {filtros && <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">{filtros}</div>}
      {cifras && (
        <dl className={`mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 ${ancha ? '' : 'xl:grid-cols-2 2xl:grid-cols-4'}`}>{cifras}</dl>
      )}
      <div className="flex flex-col gap-5">{children}</div>
    </Card>
  );
}

/** Un gráfico dentro de la sección: título (dice qué se grafica) y el gráfico */
export function Grafico({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold">{titulo}</h3>
      {nota && <p className="text-xs text-slate-500 dark:text-slate-400">{nota}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );
}

interface CifraProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
  /** Ícono del indicador (a la izquierda, en un recuadro del color de su estado) */
  icono?: LucideIcon;
  /** Estado: 'bien' o 'alerta' agregan ícono y color al detalle (nunca solo el color) */
  estado?: { tipo: 'bien' | 'alerta'; icono: LucideIcon };
}

/** Colores del indicador según su estado: franja lateral, recuadro del ícono y texto del detalle */
const TONO_CIFRA = {
  normal: {
    franja: 'border-l-brand-500',
    icono: 'bg-sky-50 text-brand-700 dark:bg-brand-500/15 dark:text-sky-300',
    detalle: 'text-slate-500 dark:text-slate-400',
  },
  alerta: {
    franja: 'border-l-red-500',
    icono: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    detalle: 'font-semibold text-red-700 dark:text-red-400',
  },
  bien: {
    franja: 'border-l-emerald-500',
    icono: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    detalle: 'text-emerald-700 dark:text-emerald-400',
  },
};

/** Cifra clave de la sección */
export function Cifra({ etiqueta, valor, detalle, icono: Icono, estado }: CifraProps) {
  const IconoEstado = estado?.icono;
  const tono = TONO_CIFRA[estado?.tipo ?? 'normal'];
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-xl border border-l-4 border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${tono.franja}`}>
      {Icono && (
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tono.icono}`} aria-hidden="true">
          <Icono size={22} />
        </span>
      )}
      <div className="min-w-0">
        <dt className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{etiqueta}</dt>
        <dd className="truncate text-2xl leading-tight font-bold tabular-nums">{valor}</dd>
        {detalle && (
          <dd className={`mt-0.5 flex items-center gap-1 text-xs ${tono.detalle}`}>
            {IconoEstado && <IconoEstado size={12} className="shrink-0" aria-hidden />}
            <span className="min-w-0">{detalle}</span>
          </dd>
        )}
      </div>
    </div>
  );
}

/** Sección sin datos en el año: explica qué falta y dónde registrarlo */
export function SinDatosSeccion({ texto }: { texto: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{texto}</p>;
}

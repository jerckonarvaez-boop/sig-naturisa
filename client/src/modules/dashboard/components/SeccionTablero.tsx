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
  /** Estado: 'bien' o 'alerta' agregan ícono y color al detalle (nunca solo el color) */
  estado?: { tipo: 'bien' | 'alerta'; icono: LucideIcon };
}

/** Cifra clave de la sección */
export function Cifra({ etiqueta, valor, detalle, estado }: CifraProps) {
  const Icono = estado?.icono;
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{etiqueta}</dt>
      <dd className="text-2xl leading-tight font-semibold">{valor}</dd>
      {detalle && (
        <dd
          className={`mt-0.5 flex items-center gap-1 text-xs ${
            estado?.tipo === 'alerta'
              ? 'font-semibold text-red-700 dark:text-red-400'
              : estado?.tipo === 'bien'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {Icono && <Icono size={12} aria-hidden />}
          {detalle}
        </dd>
      )}
    </div>
  );
}

/** Sección sin datos en el año: explica qué falta y dónde registrarlo */
export function SinDatosSeccion({ texto }: { texto: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{texto}</p>;
}

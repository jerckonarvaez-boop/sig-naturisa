import { Navigate, NavLink, useParams } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import type { SubSection } from '@/modules/types';
import { PUNTOS_MONITOREO, meta } from '../meta';

// Subsección de Monitoreo de agua (Resultados o Reportes) con pestañas Afluente / Efluente.
// El contenido de cada pestaña se definirá en las próximas fases.
export function SubseccionPuntos({ subseccion }: { subseccion: SubSection }) {
  const { punto } = useParams();
  const actual = PUNTOS_MONITOREO.find((p) => p.id === punto);
  if (!actual) return <Navigate to={`${subseccion.path}/${PUNTOS_MONITOREO[0].id}`} replace />;

  return (
    <>
      <PageHeader title={subseccion.label} subtitle={subseccion.description} breadcrumb={{ label: meta.label, to: meta.path }} />

      <div role="tablist" aria-label="Punto de monitoreo" className="mb-4 flex flex-wrap gap-2">
        {PUNTOS_MONITOREO.map((p) => (
          <NavLink
            key={p.id}
            to={`${subseccion.path}/${p.id}`}
            role="tab"
            aria-selected={p.id === actual.id}
            className={({ isActive }) =>
              `inline-flex items-center rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-brand-900 bg-brand-900 text-white dark:border-sky-500 dark:bg-sky-600'
                  : 'border-slate-200 bg-white text-brand-900 hover:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`
            }
          >
            {p.label}
          </NavLink>
        ))}
      </div>

      <Card title={actual.label} subtitle={actual.description}>
        <div className="flex flex-col items-center py-12 text-center">
          <Construction size={40} className="text-brand-500" />
          <p className="mt-4 text-lg font-semibold">En construcción</p>
          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Aquí se mostrarán los {subseccion.label.toLowerCase()} del {actual.label.toLowerCase()}. Lo iremos definiendo en las
            próximas fases.
          </p>
        </div>
      </Card>
    </>
  );
}

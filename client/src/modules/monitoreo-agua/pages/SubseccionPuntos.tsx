import { Navigate, NavLink, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import type { SubSection } from '@/modules/types';
import { ApendiceAsc } from '../components/ApendiceAsc';
import { InformesEfluente } from '../components/InformesEfluente';
import { ResultadosLista } from '../components/ResultadosLista';
import { PUNTOS_MONITOREO, REPORTES_AGUA, meta } from '../meta';

// Subsección de Monitoreo de agua (Resultados o Reportes) con pestañas Afluente / Efluente.
export function SubseccionPuntos({ subseccion }: { subseccion: SubSection }) {
  const { punto } = useParams();
  const actual = PUNTOS_MONITOREO.find((p) => p.id === punto);
  if (!actual) return <Navigate to={`${subseccion.path}/${PUNTOS_MONITOREO[0].id}`} replace />;

  const esReporte = subseccion.id === REPORTES_AGUA.id;

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={subseccion.label} subtitle={subseccion.description} breadcrumb={{ label: meta.label, to: meta.path }} />

        <div role="tablist" aria-label="Punto de monitoreo" className="mb-4 flex flex-wrap items-center gap-2">
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
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {esReporte
              ? actual.id === 'efluente'
                ? 'Informe de Monitoreo PGC-025 por camaronera (AM 097a)'
                : 'Apéndice X · Calidad de agua (ASC)'
              : actual.description}
          </span>
        </div>
      </div>

      {!esReporte ? <ResultadosLista key={actual.id} punto={actual.id} /> : actual.id === 'efluente' ? <InformesEfluente /> : <ApendiceAsc />}
    </>
  );
}

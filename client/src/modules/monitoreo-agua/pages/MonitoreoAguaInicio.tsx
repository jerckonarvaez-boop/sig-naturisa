import { Link } from 'react-router-dom';
import { ChevronRight, FileText, TestTubes } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PUNTOS_MONITOREO, REPORTES_AGUA, RESULTADOS_AGUA, meta } from '../meta';

const ICONOS = { [RESULTADOS_AGUA.id]: TestTubes, [REPORTES_AGUA.id]: FileText };

// Página de entrada de Monitoreo de agua: acceso a Resultados y Reportes
export function MonitoreoAguaInicio() {
  return (
    <>
      <PageHeader title={meta.label} subtitle={meta.description} />
      <div className="grid gap-4 md:grid-cols-2">
        {meta.children?.map((section) => {
          const Icono = ICONOS[section.id];
          return (
            <Link
              key={section.id}
              to={section.path}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-400"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white">
                <Icono size={22} />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-semibold">{section.label}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {PUNTOS_MONITOREO.map((p) => p.label).join(' y ')}
                </span>
              </span>
              <ChevronRight className="text-slate-400 transition group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>
    </>
  );
}

import { Link } from 'react-router-dom';
import { ChevronRight, Gauge } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { meta } from '../meta';

// Página de entrada de Laboratorios: acceso a cada sección
export function LaboratoriosInicio() {
  return (
    <>
      <PageHeader title={meta.label} subtitle={meta.description} />
      <div className="grid gap-4 md:grid-cols-2">
        {meta.children?.map((section) => (
          <Link
            key={section.id}
            to={section.path}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-400"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white">
              <Gauge size={22} />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-semibold">{section.label}</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">{section.description}</span>
            </span>
            <ChevronRight className="text-slate-400 transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </>
  );
}

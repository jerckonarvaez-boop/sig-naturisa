import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/** Enlace de regreso a la página padre, ej. { label: 'Auditorías', to: '/auditorias' } */
export interface Breadcrumb {
  label: string;
  to: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: Breadcrumb;
}

export function PageHeader({ title, subtitle, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {breadcrumb && (
          <Link
            to={breadcrumb.to}
            className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:underline"
          >
            <ChevronLeft size={15} />
            {breadcrumb.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

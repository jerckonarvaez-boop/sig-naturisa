import { Construction } from 'lucide-react';
import { Card } from './Card';
import { PageHeader, type Breadcrumb } from './PageHeader';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  breadcrumb?: Breadcrumb;
}

// Página temporal para módulos o secciones cuyo contenido aún no está definido.
export function ModulePlaceholder({ title, description, breadcrumb }: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} subtitle={description} breadcrumb={breadcrumb} />
      <Card className="flex flex-col items-center py-16 text-center">
        <Construction size={40} className="text-brand-500" />
        <p className="mt-4 text-lg font-semibold">En construcción</p>
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Aquí se mostrará el contenido de {title}. Lo iremos definiendo en las próximas fases.
        </p>
      </Card>
    </>
  );
}

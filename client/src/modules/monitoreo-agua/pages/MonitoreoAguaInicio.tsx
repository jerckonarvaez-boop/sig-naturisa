import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardList, FileText, TestTubes } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FICHAS_TECNICAS, REPORTES_AGUA, RESULTADOS_AGUA, meta } from '../meta';

const ACCESOS = [
  { seccion: RESULTADOS_AGUA, Icono: TestTubes, detalle: 'Informes de los laboratorios · Afluente y Efluente' },
  { seccion: REPORTES_AGUA, Icono: FileText, detalle: 'Informes PGC-025 (efluente) y Apéndice X ASC (afluente)' },
  { seccion: FICHAS_TECNICAS, Icono: ClipboardList, detalle: 'Camaroneras e instalaciones de los informes' },
];

// Página de entrada de Monitoreo de agua: acceso a Resultados, Reportes y Fichas técnicas
export function MonitoreoAguaInicio() {
  return (
    <>
      <PageHeader title={meta.label} subtitle={meta.description} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ACCESOS.map(({ seccion, Icono, detalle }) => (
          <Link
            key={seccion.id}
            to={seccion.path}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-400"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white">
              <Icono size={22} />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-semibold">{seccion.label}</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">{detalle}</span>
            </span>
            <ChevronRight className="text-slate-400 transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </>
  );
}

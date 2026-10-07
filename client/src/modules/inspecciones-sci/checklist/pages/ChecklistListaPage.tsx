import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { meta } from '@/modules/inspecciones-sci/meta';
import { TablaRevisiones } from '../components/TablaRevisiones';
import { useRevisiones } from '../hooks/useRevisiones';

/** Historial de revisiones del check list, con su cumplimiento por área. */
export function ChecklistListaPage() {
  const { revisiones, error } = useRevisiones();

  const botonNueva = (
    <Link to="nueva" className={`${BOTON_PRIMARIO} inline-flex items-center gap-1.5 py-2`}>
      <Plus size={16} /> Nueva revisión
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Check list Buenas Prácticas"
        subtitle="Revisión de áreas previa a la inspección SCI"
        breadcrumb={{ label: meta.label, to: meta.path }}
        actions={botonNueva}
      />

      {error ? (
        <Card className="py-10 text-center text-red-600">No se pudieron cargar las revisiones: {error}</Card>
      ) : !revisiones ? (
        <Card className="py-10 text-center text-slate-500">Cargando…</Card>
      ) : !revisiones.length ? (
        <Card className="flex flex-col items-center py-14 text-center">
          <ClipboardList size={40} className="text-brand-500" />
          <p className="mt-3 text-lg font-semibold">Aún no hay revisiones registradas</p>
          <p className="mt-1 mb-4 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Registre la revisión de una sucursal con el formato de 43 requisitos en 5 áreas.
          </p>
          {botonNueva}
        </Card>
      ) : (
        <Card compact>
          <TablaRevisiones revisiones={revisiones} />
        </Card>
      )}
    </>
  );
}

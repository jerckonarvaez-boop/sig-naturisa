import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { meta } from '../../meta';
import { TablaInformes } from '../components/TablaInformes';
import { useDefinicion } from '../hooks/useDefinicion';
import { useInformes } from '../hooks/useInformes';
import type { SeccionId } from '../types';

/** Historial de informes de una sección de laboratorio (agua, suelo o patologías). */
export function InformesPage({ seccionId }: { seccionId: SeccionId }) {
  const { definicion, error: errorDefinicion } = useDefinicion();
  const { informes, error } = useInformes(seccionId);
  const seccion = definicion?.secciones[seccionId];

  const botonNuevo = (
    <Link to="nuevo" className={`${BOTON_PRIMARIO} inline-flex items-center gap-1.5 py-2`}>
      <Plus size={16} /> Nuevo informe
    </Link>
  );

  return (
    <>
      <PageHeader
        title={seccion?.nombre ?? 'Laboratorio'}
        subtitle={seccion ? `Informes ${seccion.prefijo} · ${seccion.tipos.map((t) => t.nombre).join(' · ')}` : undefined}
        breadcrumb={{ label: meta.label, to: meta.path }}
        actions={botonNuevo}
      />
      {error || errorDefinicion ? (
        <Card className="py-10 text-center text-red-600">No se pudieron cargar los informes: {error ?? errorDefinicion}</Card>
      ) : !informes || !seccion ? (
        <Card className="py-10 text-center text-slate-500">Cargando…</Card>
      ) : !informes.length ? (
        <Card className="flex flex-col items-center py-14 text-center">
          <FileText size={40} className="text-brand-500" />
          <p className="mt-3 text-lg font-semibold">Aún no hay informes de {seccion.nombre.toLowerCase()}</p>
          <p className="mt-1 mb-4 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Registre los resultados con el mismo formato del informe: un parámetro por fila y una columna por {seccion.etiquetaMuestra.toLowerCase()}.
          </p>
          {botonNuevo}
        </Card>
      ) : (
        <Card compact title={`${informes.length} ${informes.length === 1 ? 'informe' : 'informes'}`} subtitle="Pulse una fila para abrirlo">
          <TablaInformes seccion={seccion} informes={informes} />
        </Card>
      )}
    </>
  );
}

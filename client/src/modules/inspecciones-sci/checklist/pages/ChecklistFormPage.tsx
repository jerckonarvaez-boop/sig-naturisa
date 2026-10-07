import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BarraGuardarMovil } from '../components/BarraGuardarMovil';
import { FormDatosRevision } from '../components/FormDatosRevision';
import { ResumenCumplimiento } from '../components/ResumenCumplimiento';
import { SeccionChecklist } from '../components/SeccionChecklist';
import { RUTA_LISTA, useRevisionForm } from '../hooks/useRevisionForm';

/** Formulario para registrar (o editar) una revisión del check list de Buenas Prácticas. */
export function ChecklistFormPage() {
  const { id } = useParams();
  const revisionId = id ? Number(id) : null;
  const form = useRevisionForm(revisionId);

  if (form.cargando) return <Card className="py-12 text-center text-slate-500">Cargando check list…</Card>;

  return (
    <>
      <PageHeader
        title={revisionId ? `Check list · ${form.datos.sucursal || 'Revisión'}` : 'Nueva revisión'}
        subtitle="Check list de Buenas Prácticas · revisión previa a la inspección SCI"
        breadcrumb={{ label: 'Check list Buenas Prácticas', to: RUTA_LISTA }}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 pb-20 xl:grid-cols-[minmax(0,1fr)_280px] xl:pb-0 print:pb-0">
        <div className="flex flex-col gap-4">
          <FormDatosRevision datos={form.datos} onCambiar={form.cambiarDatos} sucursales={form.sucursales} />

          {form.secciones.map((s) => (
            <SeccionChecklist key={s.seccion} seccion={s.seccion} items={s.items} respuestas={form.respuestas} onCambiar={form.cambiarRespuesta} />
          ))}
        </div>

        {/* Resumen fijo mientras se recorre el formulario */}
        <aside className="xl:sticky xl:top-0 xl:self-start">
          <ResumenCumplimiento
            conteo={form.conteoGeneral}
            areas={form.conteoPorArea}
            mensaje={form.mensaje}
            guardando={form.guardando}
            puedeEliminar={revisionId !== null}
            onGuardar={form.guardar}
            onEliminar={form.eliminar}
          />
        </aside>
      </div>

      <BarraGuardarMovil conteo={form.conteoGeneral} mensaje={form.mensaje} guardando={form.guardando} onGuardar={form.guardar} />
    </>
  );
}

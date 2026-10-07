import { PageHeader } from '@/components/ui/PageHeader';
import { CalendarioEventos } from '@/modules/eventos/components/CalendarioEventos';
import { meta } from '../meta';

// Inspecciones SCI: calendario de inspecciones (programadas y realizadas)
export function CalendarioInspeccionesPage() {
  return (
    <>
      <PageHeader title={meta.label} subtitle={meta.description} />
      <CalendarioEventos tipos={['inspeccion-sci']} titulo="Calendario de inspecciones" />
    </>
  );
}

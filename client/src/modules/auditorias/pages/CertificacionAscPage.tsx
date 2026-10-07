import { PageHeader } from '@/components/ui/PageHeader';
import { CalendarioEventos } from '@/modules/eventos/components/CalendarioEventos';
import { CERTIFICACION_ASC, meta } from '../meta';

// Certificación ASC: calendario de auditorías (programadas y realizadas)
export function CertificacionAscPage() {
  return (
    <>
      <PageHeader
        title={CERTIFICACION_ASC.label}
        subtitle={CERTIFICACION_ASC.description}
        breadcrumb={{ label: meta.label, to: meta.path }}
      />
      <CalendarioEventos tipos={['auditoria-asc']} titulo="Calendario de auditorías ASC" />
    </>
  );
}

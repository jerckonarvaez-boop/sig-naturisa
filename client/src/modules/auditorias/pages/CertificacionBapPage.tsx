import { PageHeader } from '@/components/ui/PageHeader';
import { CalendarioEventos } from '@/modules/eventos/components/CalendarioEventos';
import { CERTIFICACION_BAP, meta } from '../meta';

// Certificación BAP: calendario de auditorías (programadas y realizadas)
export function CertificacionBapPage() {
  return (
    <>
      <PageHeader
        title={CERTIFICACION_BAP.label}
        subtitle={CERTIFICACION_BAP.description}
        breadcrumb={{ label: meta.label, to: meta.path }}
      />
      <CalendarioEventos tipos={['auditoria-bap']} titulo="Calendario de auditorías BAP" />
    </>
  );
}

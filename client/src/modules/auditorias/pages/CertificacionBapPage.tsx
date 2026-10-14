import { PageHeader } from '@/components/ui/PageHeader';
import { ProximasFechasCard } from '@/modules/eventos/components/ProximasFechasCard';
import { CERTIFICACION_BAP, meta } from '../meta';

// Certificación BAP: próximas auditorías (las fechas se programan en el Calendario general)
export function CertificacionBapPage() {
  return (
    <>
      <PageHeader
        title={CERTIFICACION_BAP.label}
        subtitle={CERTIFICACION_BAP.description}
        breadcrumb={{ label: meta.label, to: meta.path }}
      />
      <div className="max-w-2xl">
        <ProximasFechasCard tipos={['auditoria-bap']} titulo="Próximas auditorías BAP" />
      </div>
    </>
  );
}

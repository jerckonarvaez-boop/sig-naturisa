import { PageHeader } from '@/components/ui/PageHeader';
import { ProximasFechasCard } from '@/modules/eventos/components/ProximasFechasCard';
import { CERTIFICACION_ASC, meta } from '../meta';

// Certificación ASC: próximas auditorías (las fechas se programan en el Calendario general)
export function CertificacionAscPage() {
  return (
    <>
      <PageHeader
        title={CERTIFICACION_ASC.label}
        subtitle={CERTIFICACION_ASC.description}
        breadcrumb={{ label: meta.label, to: meta.path }}
      />
      <div className="max-w-2xl">
        <ProximasFechasCard tipos={['auditoria-asc']} titulo="Próximas auditorías ASC" />
      </div>
    </>
  );
}

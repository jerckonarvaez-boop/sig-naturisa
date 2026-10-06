import { PageHeader } from '@/components/PageHeader';
import { DEMO_USER } from '@/config/app';
import { ProximasFechasCard } from '@/features/eventos/components/ProximasFechasCard';
import { formatLongDate } from '@/utils/format';
import { DevelopmentPlanCard } from './DevelopmentPlanCard';
import { SystemStatusCard } from './SystemStatusCard';

export function DashboardPage() {
  return (
    <>
      <PageHeader title={`Bienvenido, ${DEMO_USER.name}`} subtitle={formatLongDate(new Date())} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SystemStatusCard />
          <ProximasFechasCard />
        </div>
        <DevelopmentPlanCard />
      </div>
    </>
  );
}

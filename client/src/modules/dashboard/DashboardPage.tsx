import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { ProximasFechasCard } from '@/modules/eventos/components/ProximasFechasCard';
import { formatLongDate } from '@/utils/fechas';
import { DevelopmentPlanCard } from './components/DevelopmentPlanCard';
import { SystemStatusCard } from './components/SystemStatusCard';

export function DashboardPage() {
  const { nombreVisible } = useAuth();
  return (
    <>
      <PageHeader title={`Bienvenido, ${nombreVisible}`} subtitle={formatLongDate(new Date())} />
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

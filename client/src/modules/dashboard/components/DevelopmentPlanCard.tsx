import { Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DEVELOPMENT_PLAN, type PhaseStatus } from '@/config/developmentPlan';

const DOT_CLASSES: Record<PhaseStatus, string> = {
  completada: 'border-emerald-500 bg-emerald-500 text-white',
  'en-curso': 'border-brand-700 bg-brand-700 dark:border-sky-400 dark:bg-sky-400',
  pendiente: 'border-brand-800 bg-white dark:border-slate-400 dark:bg-slate-900',
};

export function DevelopmentPlanCard() {
  return (
    <Card title="Plan de desarrollo">
      <ol>
        {DEVELOPMENT_PLAN.map((phase, index) => {
          const isLast = index === DEVELOPMENT_PLAN.length - 1;
          return (
            <li key={phase.title} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && (
                <span className="absolute top-5 bottom-0 left-[9px] w-0.5 bg-brand-800 dark:bg-slate-500" />
              )}
              <span
                className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${DOT_CLASSES[phase.status]}`}
              >
                {phase.status === 'completada' && <Check size={12} strokeWidth={3} />}
              </span>
              <div className="-mt-0.5">
                <p className="font-semibold">
                  {phase.title}
                  {phase.status === 'en-curso' && (
                    <span className="ml-2 text-xs font-medium text-brand-500">· En curso</span>
                  )}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{phase.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

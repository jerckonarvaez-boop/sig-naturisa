import { Clock } from 'lucide-react';

/** Aviso de que la sesión está por cerrarse por inactividad, con cuenta regresiva y "Seguir conectado" */
export function AvisoInactividad({ restante, onSeguir }: { restante: number; onSeguir: () => void }) {
  const s = Math.max(0, Math.ceil(restante / 1000));
  const reloj = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="La sesión se cerrará por inactividad"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-lg flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 dark:border-amber-500/40 dark:bg-slate-900 dark:text-amber-100 print:hidden"
    >
      <Clock size={18} className="shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
      <p className="min-w-0 flex-1">
        Por inactividad, su sesión se cerrará en <b className="tabular-nums">{reloj}</b>.
      </p>
      <button
        type="button"
        onClick={onSeguir}
        className="rounded-lg bg-brand-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-sky-600 dark:hover:bg-sky-500"
      >
        Seguir conectado
      </button>
    </div>
  );
}

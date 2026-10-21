import { Check } from 'lucide-react';
import type { Sitio } from '../types';

interface SelectorSitiosProps {
  sitios: Sitio[];
  elegidos: number[];
  onCambiar: (ids: number[]) => void;
}

/** Casillas para elegir las camaroneras o instalaciones que cubre el resultado (un drenaje puede servir a varias) */
export function SelectorSitios({ sitios, elegidos, onCambiar }: SelectorSitiosProps) {
  // Las desactivadas solo se muestran si ya estaban elegidas
  const visibles = sitios.filter((s) => s.activo || elegidos.includes(s.id));
  const alternar = (id: number) => onCambiar(elegidos.includes(id) ? elegidos.filter((x) => x !== id) : [...elegidos, id]);

  if (!visibles.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Aún no hay camaroneras: agréguelas en Fichas técnicas.</p>;
  }

  return (
    <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Camaroneras o instalaciones">
      {visibles.map((s) => {
        const activo = elegidos.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            role="checkbox"
            aria-checked={activo}
            onClick={() => alternar(s.id)}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[13px] transition-colors ${
              activo
                ? 'border-brand-500 bg-brand-500/10 font-semibold dark:border-sky-500 dark:bg-sky-500/10'
                : 'border-slate-200 hover:border-brand-500 dark:border-slate-700'
            }`}
          >
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                activo ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-400 dark:border-slate-500'
              }`}
            >
              {activo && <Check size={12} strokeWidth={3} />}
            </span>
            <span className="text-slate-400 tabular-nums">{s.numero}.</span>
            <span className="flex-1">{s.nombre}</span>
          </button>
        );
      })}
    </div>
  );
}

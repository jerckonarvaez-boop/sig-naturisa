import type { ReactNode } from 'react';

/** Estilo común de inputs, selects y textareas de los formularios */
export const CLASE_CONTROL =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950';

interface CampoProps {
  etiqueta: string;
  /** Clases extra del contenedor, ej. 'sm:col-span-2' para ocupar más columnas */
  className?: string;
  children: ReactNode;
}

/** Etiqueta + control de formulario */
export function Campo({ etiqueta, className = '', children }: CampoProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{etiqueta}</span>
      {children}
    </label>
  );
}

import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  /** Texto pequeño bajo el título */
  subtitle?: string;
  children: ReactNode;
  className?: string;
  /** Versión compacta (menos relleno y título más pequeño), para tableros con muchos gráficos */
  compact?: boolean;
}

export function Card({ title, subtitle, children, className = '', compact = false }: CardProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        compact ? 'p-4' : 'p-5'
      } ${className}`}
    >
      {title && (
        <div className={compact ? 'mb-2' : 'mb-4'}>
          <h2 className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

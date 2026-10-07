import type { ReactNode } from 'react';

/** Fila de encabezado estándar (fondo gris claro, texto azul corporativo) */
export const FILA_ENCABEZADO = 'bg-slate-50 text-left text-brand-900 dark:bg-slate-800/60 dark:text-slate-200';

interface TablaProps {
  /** Ancho mínimo para que en móvil la tabla se desplace en lugar de comprimirse, ej. 'min-w-[720px]' */
  anchoMinimo: string;
  children: ReactNode;
}

/** Tabla con borde redondeado y desplazamiento horizontal. Recibe <thead>, <tbody> y <tfoot>. */
export function Tabla({ anchoMinimo, children }: TablaProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className={`w-full ${anchoMinimo} border-collapse text-[13px]`}>{children}</table>
    </div>
  );
}

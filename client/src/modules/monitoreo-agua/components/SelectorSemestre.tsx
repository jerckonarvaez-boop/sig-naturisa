/** 0 = todo el año · 1 = enero a junio · 2 = julio a diciembre */
export type Periodo = 0 | 1 | 2;

/** Filtro por semestre de las listas de resultados y de informes */
export function SelectorSemestre({ periodo, onCambiar }: { periodo: Periodo; onCambiar: (p: Periodo) => void }) {
  return (
    <select
      value={periodo}
      onChange={(e) => onCambiar(Number(e.target.value) as Periodo)}
      aria-label="Semestre"
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      <option value={0}>Todo el año</option>
      <option value={1}>Primer semestre</option>
      <option value={2}>Segundo semestre</option>
    </select>
  );
}

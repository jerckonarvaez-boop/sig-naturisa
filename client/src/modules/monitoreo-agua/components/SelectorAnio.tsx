interface SelectorAnioProps {
  anios: number[];
  /** null = todos los años */
  anio: number | null;
  onCambiar: (anio: number | null) => void;
}

/** Lista para filtrar por año (con la opción "Todos los años") */
export function SelectorAnio({ anios, anio, onCambiar }: SelectorAnioProps) {
  return (
    <select
      value={anio ?? ''}
      onChange={(e) => onCambiar(e.target.value ? Number(e.target.value) : null)}
      aria-label="Año"
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {anios.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
      <option value="">Todos los años</option>
    </select>
  );
}

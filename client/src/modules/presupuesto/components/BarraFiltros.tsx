import { BadgeCheck, FlaskConical, LayoutGrid, Leaf, X, type LucideIcon } from 'lucide-react';
import { MESES_LARGO } from '../formato';
import { AREA_GENERAL } from '../logica';
import type { Filtros } from '../types';

// Íconos de las pestañas por área (las áreas nuevas aparecen sin ícono)
const ICONOS_AREA: Record<string, LucideIcon> = {
  [AREA_GENERAL]: LayoutGrid,
  Calidad: BadgeCheck,
  'Medio Ambiente': Leaf,
  'Laboratorio de Análisis': FlaskConical,
};

type ClaveChip = 'item' | 'sucursal' | 'subarea' | 'mes' | 'busqueda';

interface BarraFiltrosProps {
  filtros: Filtros;
  areas: string[];
  anios: number[];
  onArea: (area: string) => void;
  onAnio: (anio: number) => void;
  onQuitar: (clave: ClaveChip | 'todo') => void;
}

/** Fila única de filtros sobre los gráficos: área, año y filtros activos. */
export function BarraFiltros({ filtros, areas, anios, onArea, onAnio, onQuitar }: BarraFiltrosProps) {
  const chips: [ClaveChip, string][] = [];
  if (filtros.item) chips.push(['item', `Ítem: ${filtros.item}`]);
  if (filtros.sucursal) chips.push(['sucursal', `Sucursal: ${filtros.sucursal}`]);
  if (filtros.subarea) chips.push(['subarea', `Sub-área: ${filtros.subarea}`]);
  if (filtros.mes != null) chips.push(['mes', `Mes: ${MESES_LARGO[filtros.mes]}`]);
  if (filtros.busqueda) chips.push(['busqueda', `Búsqueda: “${filtros.busqueda}”`]);

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Área" className="flex flex-wrap gap-2">
          {[AREA_GENERAL, ...areas].map((area) => {
            const Icono = ICONOS_AREA[area];
            const activa = filtros.area === area;
            return (
              <button
                key={area}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => onArea(area)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  activa
                    ? 'border-brand-900 bg-brand-900 text-white dark:border-sky-500 dark:bg-sky-600'
                    : 'border-slate-200 bg-white text-brand-900 hover:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                {Icono && <Icono size={16} />}
                {area}
              </button>
            );
          })}
        </div>

        <select
          value={filtros.anio ?? ''}
          onChange={(e) => onAnio(Number(e.target.value))}
          aria-label="Año"
          className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map(([clave, texto]) => (
            <span
              key={clave}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-white py-0.5 pr-1 pl-3 text-xs font-semibold text-brand-900 dark:border-sky-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {texto}
              <button
                type="button"
                onClick={() => onQuitar(clave)}
                aria-label={`Quitar filtro ${texto}`}
                className="rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={13} />
              </button>
            </span>
          ))}
          {chips.length > 1 && (
            <button type="button" onClick={() => onQuitar('todo')} className="text-xs font-semibold text-brand-500 hover:underline">
              Quitar todos
            </button>
          )}
        </div>
      )}
    </div>
  );
}

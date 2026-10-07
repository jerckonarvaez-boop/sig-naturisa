import { ESTADOS } from '../config';
import type { EstadoVisual } from '../types';

export function EstadoBadge({ estado }: { estado: EstadoVisual }) {
  const { label, icono: Icono, badge } = ESTADOS[estado];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${badge}`}>
      <Icono size={12} />
      {label}
    </span>
  );
}

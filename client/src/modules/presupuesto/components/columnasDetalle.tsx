import type { ReactNode } from 'react';
import { fechaNumerica } from '@/utils/fechas';
import { dinero, miles } from '@/utils/numeros';
import type { Registro } from '../types';

export type ColumnaOrden = 'fechaSolped' | 'notaGeneral' | 'item' | 'subarea' | 'sucursalNombre' | 'estado' | 'cantidad' | 'precioUnitario' | 'total';

interface Columna {
  clave: ColumnaOrden;
  titulo: string;
  numerica?: boolean;
  celda: (r: Registro) => ReactNode;
}

const Secundario = ({ children }: { children: string }) =>
  children ? (
    <span className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400" title={children}>
      {children}
    </span>
  ) : null;

/** Texto principal de celda, limitado a 2 líneas */
const Principal = ({ children }: { children: string }) => (
  <span className="line-clamp-2" title={children}>
    {children}
  </span>
);

/** Columnas de la tabla: título, alineación y cómo se dibuja cada celda */
export const COLUMNAS: Columna[] = [
  { clave: 'fechaSolped', titulo: 'Fecha', celda: (r) => fechaNumerica(r.fechaSolped) },
  { clave: 'notaGeneral', titulo: 'Nota general', celda: (r) => <><Principal>{r.notaGeneral}</Principal><Secundario>{r.solped}</Secundario></> },
  { clave: 'item', titulo: 'Ítem', celda: (r) => <><Principal>{r.item}</Principal><Secundario>{r.notaPosicion}</Secundario></> },
  { clave: 'subarea', titulo: 'Sub-área', celda: (r) => <><Principal>{r.subarea}</Principal><Secundario>{r.area}</Secundario></> },
  {
    clave: 'sucursalNombre',
    titulo: 'Sucursal',
    celda: (r) => <>{r.sucursalNombre}<Secundario>{r.cluster !== r.sucursal ? r.cluster : ''}</Secundario></>,
  },
  {
    clave: 'estado',
    titulo: 'Estado',
    celda: (r) =>
      r.estado && (
        <span className="inline-block rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium whitespace-nowrap dark:border-slate-600">
          {r.estado}
        </span>
      ),
  },
  { clave: 'cantidad', titulo: 'Cantidad', numerica: true, celda: (r) => miles(r.cantidad, r.cantidad % 1 ? 2 : 0) },
  { clave: 'precioUnitario', titulo: 'Costo unitario', numerica: true, celda: (r) => dinero(r.precioUnitario, 2) },
  { clave: 'total', titulo: 'Total', numerica: true, celda: (r) => dinero(r.total, 2) },
];

import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { fechaCorta } from '@/utils/fechas';
import { dinero, miles } from '@/utils/numeros';
import { ahorroDe } from '../logic/ahorro';
import type { Reparacion } from '../types';
import { EstadoReparacionBadge } from './EstadoReparacionBadge';

interface TablaReparacionesProps {
  reparaciones: Reparacion[];
  onEditar: (reparacion: Reparacion) => void;
}

/** Historial de reparaciones con el ahorro de cada una. Clic en una fila para editarla. */
export function TablaReparaciones({ reparaciones, onEditar }: TablaReparacionesProps) {
  const totalAhorro = reparaciones.reduce((t, r) => t + ahorroDe(r), 0);

  return (
    <Tabla anchoMinimo="min-w-[820px]">
      <thead>
        <tr className={FILA_ENCABEZADO}>
          <th className="px-3 py-2 font-semibold">Fecha</th>
          <th className="px-3 py-2 font-semibold">Parte</th>
          <th className="px-3 py-2 text-right font-semibold">Cant.</th>
          <th className="px-3 py-2 text-right font-semibold">Precio nuevo c/u</th>
          <th className="px-3 py-2 font-semibold">Centro de costo</th>
          <th className="px-3 py-2 font-semibold">Estado</th>
          <th className="px-3 py-2 text-right font-semibold">Ahorro</th>
        </tr>
      </thead>
      <tbody>
        {reparaciones.map((r) => {
          const ahorro = ahorroDe(r);
          return (
            <tr
              key={r.id}
              tabIndex={0}
              onClick={() => onEditar(r)}
              onKeyDown={(e) => e.key === 'Enter' && onEditar(r)}
              className="cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <td className="px-3 py-2 whitespace-nowrap">{fechaCorta(r.fecha)}</td>
              <td className="px-3 py-2">
                <span className="font-medium">{r.parte}</span>
                {r.equipo && <span className="block text-xs text-slate-500 dark:text-slate-400">{r.equipo}</span>}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{miles(r.cantidad)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{dinero(r.precioNuevo, 2)}</td>
              <td className="px-3 py-2">{r.sucursal || '—'}</td>
              <td className="px-3 py-2">
                <EstadoReparacionBadge estado={r.estado} />
              </td>
              <td
                className={`px-3 py-2 text-right font-semibold tabular-nums ${r.estado !== 'reparado' ? 'text-slate-400 dark:text-slate-500' : ''}`}
                title={r.estado !== 'reparado' ? 'Solo cuenta el ahorro de las partes ya reparadas' : undefined}
              >
                {r.estado === 'reparado' ? dinero(ahorro, 2) : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="bg-slate-50 font-semibold dark:bg-slate-800/60">
          <td colSpan={6} className="px-3 py-2">
            Ahorro total
          </td>
          <td className="px-3 py-2 text-right tabular-nums">{dinero(totalAhorro, 2)}</td>
        </tr>
      </tfoot>
    </Tabla>
  );
}

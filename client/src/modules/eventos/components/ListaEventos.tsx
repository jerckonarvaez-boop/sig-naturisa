import { TIPOS } from '../config';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { textoRelativo } from '@/utils/fechas';
import { estadoVisual, rangoFechas } from '../logic/eventos';
import type { Evento } from '../types';
import { EstadoBadge } from './EstadoBadge';

interface ListaEventosProps {
  eventos: Evento[];
  mostrarTipo: boolean;
  onEvento: (evento: Evento) => void;
  vacio: string;
}

/** Tabla de eventos. Clic en una fila para editarla. */
export function ListaEventos({ eventos, mostrarTipo, onEvento, vacio }: ListaEventosProps) {
  if (!eventos.length) {
    return <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{vacio}</p>;
  }

  return (
    <Tabla anchoMinimo="min-w-[720px]">
      <thead>
        <tr className={FILA_ENCABEZADO}>
          <th className="px-3 py-1.5 font-semibold">Fecha</th>
          {mostrarTipo && <th className="px-3 py-1.5 font-semibold">Tipo</th>}
          <th className="px-3 py-1.5 font-semibold">Título</th>
          <th className="px-3 py-1.5 font-semibold">Sucursal</th>
          <th className="px-3 py-1.5 font-semibold">Responsable</th>
          <th className="px-3 py-1.5 font-semibold">Estado</th>
        </tr>
      </thead>
      <tbody>
        {eventos.map((e) => (
          <tr
            key={e.id}
            tabIndex={0}
            onClick={() => onEvento(e)}
            onKeyDown={(ev) => ev.key === 'Enter' && onEvento(e)}
            className="cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-slate-800 dark:hover:bg-slate-800/40"
          >
            <td className="px-3 py-1.5 whitespace-nowrap">
              {rangoFechas(e)}
              <span className="block text-xs text-slate-500 dark:text-slate-400">{textoRelativo(e.fechaInicio)}</span>
            </td>
            {mostrarTipo && <td className="px-3 py-1.5 font-semibold whitespace-nowrap">{TIPOS[e.tipo].corto}</td>}
            <td className="px-3 py-1.5">
              <span className="font-medium">{e.titulo}</span>
              {e.observaciones && (
                <span className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400" title={e.observaciones}>
                  {e.observaciones}
                </span>
              )}
            </td>
            <td className="px-3 py-1.5">{e.sucursal || '—'}</td>
            <td className="px-3 py-1.5">{e.responsable || '—'}</td>
            <td className="px-3 py-1.5">
              <EstadoBadge estado={estadoVisual(e)} />
            </td>
          </tr>
        ))}
      </tbody>
    </Tabla>
  );
}

import { Card } from '@/components/ui/Card';
import type { GruposEventos } from '../logic/eventos';
import type { Evento } from '../types';
import { EventoItem } from './EventoItem';

interface PanelProximasFechasProps {
  grupos: GruposEventos;
  mostrarTipo: boolean;
  onEvento: (evento: Evento) => void;
  onVerTodos: () => void;
}

/** Panel lateral del calendario: contadores, vencidos y próximas fechas. */
export function PanelProximasFechas({ grupos, mostrarTipo, onEvento, onVerTodos }: PanelProximasFechasProps) {
  return (
    <Card compact title="Próximas fechas" className="self-start">
      <Contadores proximos={grupos.proximos.length} vencidos={grupos.vencidos.length} realizados={grupos.realizados.length} />
      {grupos.vencidos.length > 0 && (
        <div className="mb-2">
          {grupos.vencidos.slice(0, 3).map((e) => (
            <EventoItem key={e.id} evento={e} mostrarTipo={mostrarTipo} onClick={onEvento} />
          ))}
        </div>
      )}
      {grupos.proximos.length ? (
        grupos.proximos.slice(0, 6).map((e) => <EventoItem key={e.id} evento={e} mostrarTipo={mostrarTipo} onClick={onEvento} />)
      ) : (
        <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No hay fechas programadas.</p>
      )}
      {(grupos.proximos.length > 6 || grupos.vencidos.length > 3) && (
        <button type="button" onClick={onVerTodos} className="mt-1 ml-2 text-xs font-semibold text-brand-500 hover:underline">
          Ver todos en la lista
        </button>
      )}
    </Card>
  );
}

function Contadores({ proximos, vencidos, realizados }: { proximos: number; vencidos: number; realizados: number }) {
  const items = [
    { valor: proximos, etiqueta: 'próximos', clase: '' },
    { valor: vencidos, etiqueta: 'vencidos', clase: vencidos ? 'text-red-600 dark:text-red-400' : '' },
    { valor: realizados, etiqueta: 'realizados', clase: '' },
  ];
  return (
    <dl className="mb-2 grid grid-cols-3 rounded-lg bg-slate-50 py-2 text-center dark:bg-slate-800/50">
      {items.map((i) => (
        <div key={i.etiqueta}>
          <dd className={`text-lg leading-tight font-semibold ${i.clase}`}>{i.valor}</dd>
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">{i.etiqueta}</dt>
        </div>
      ))}
    </dl>
  );
}

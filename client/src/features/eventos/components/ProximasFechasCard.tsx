import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { TIPOS } from '../config';
import { estadoVisual, esProximo, hoyISO } from '../fechas';
import { useEventos } from '../useEventos';
import { EventoItem } from './EventoItem';

/** Tarjeta del Dashboard: eventos vencidos y próximos de todos los módulos. */
export function ProximasFechasCard() {
  const { eventos, cargando } = useEventos([]);
  const navigate = useNavigate();

  const { vencidos, proximos } = useMemo(() => {
    const iso = hoyISO();
    const orden = (a: { fechaInicio: string }, b: { fechaInicio: string }) => a.fechaInicio.localeCompare(b.fechaInicio);
    return {
      vencidos: eventos.filter((e) => estadoVisual(e, iso) === 'vencido').sort(orden),
      proximos: eventos.filter((e) => esProximo(e, iso)).sort(orden),
    };
  }, [eventos]);

  const lista = [...vencidos.slice(0, 3), ...proximos.slice(0, 5)];

  return (
    <Card title="Próximas fechas">
      {cargando ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : lista.length ? (
        <div className="-mx-2">
          {lista.map((e) => (
            <EventoItem key={e.id} evento={e} mostrarTipo onClick={() => navigate(TIPOS[e.tipo].ruta)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No hay auditorías ni inspecciones programadas. Puede registrarlas en el calendario de cada módulo.
        </p>
      )}
    </Card>
  );
}

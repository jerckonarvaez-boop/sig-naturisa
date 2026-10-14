import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { rutaCalendario } from '../config';
import { hoyISO } from '@/utils/fechas';
import { estadoVisual, esProximo } from '../logic/eventos';
import { useEventos } from '../hooks/useEventos';
import type { TipoEvento } from '../types';
import { EventoItem } from './EventoItem';

interface ProximasFechasCardProps {
  /** Tipos que muestra (sin tipos, todos: Dashboard) */
  tipos?: TipoEvento[];
  titulo?: string;
}

/** Eventos vencidos y próximos (de solo lectura); al pulsarlos se abre el calendario general. */
export function ProximasFechasCard({ tipos = [], titulo = 'Próximas fechas' }: ProximasFechasCardProps) {
  const { eventos, cargando } = useEventos(tipos);
  const navigate = useNavigate();
  const ruta = rutaCalendario(tipos);

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
    <Card
      title={titulo}
      actions={
        <Link to={ruta} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline">
          <CalendarDays size={15} /> Ver calendario
        </Link>
      }
    >
      {cargando ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : lista.length ? (
        <div className="-mx-2">
          {lista.map((e) => (
            <EventoItem key={e.id} evento={e} mostrarTipo={tipos.length !== 1} onClick={() => navigate(ruta)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No hay fechas programadas. Puede registrarlas en el Calendario.</p>
      )}
    </Card>
  );
}

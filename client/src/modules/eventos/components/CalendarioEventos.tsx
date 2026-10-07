import { Card } from '@/components/ui/Card';
import { PESTANAS } from '../config';
import { useCalendario } from '../hooks/useCalendario';
import type { TipoEvento } from '../types';
import { BarraCalendario } from './BarraCalendario';
import { CalendarioMes } from './CalendarioMes';
import { EventoModal } from './EventoModal';
import { ListaEventos } from './ListaEventos';
import { ModalDia } from './ModalDia';
import { PanelProximasFechas } from './PanelProximasFechas';

interface CalendarioEventosProps {
  /** Tipos de evento que muestra y permite crear este calendario */
  tipos: TipoEvento[];
  titulo?: string;
}

/**
 * Calendario reutilizable: vista mensual o lista, panel de próximas fechas
 * y formulario para crear, editar o eliminar eventos.
 */
export function CalendarioEventos({ tipos, titulo = 'Calendario' }: CalendarioEventosProps) {
  const c = useCalendario(tipos);
  const mostrarTipo = tipos.length > 1;

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card compact>
          <BarraCalendario
            titulo={titulo}
            vista={c.vista}
            anio={c.anio}
            mes={c.mes}
            onMoverMes={c.moverMes}
            onHoy={c.irAHoy}
            onVista={c.setVista}
            onNuevo={() => c.nuevo()}
          />

          {c.error && <p className="mb-2 text-sm text-red-600">No se pudieron cargar los eventos: {c.error}</p>}

          {c.vista === 'mes' ? (
            <div className={c.cargando ? 'opacity-60' : ''}>
              <CalendarioMes
                anio={c.anio}
                mes={c.mes}
                eventos={c.eventos}
                mostrarTipo={mostrarTipo}
                onDia={c.nuevo}
                onEvento={c.editar}
                onVerDia={c.setDiaAbierto}
              />
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                Pulse un día para programar un evento, o un evento para editarlo.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-1" role="tablist" aria-label="Filtro de eventos">
                {PESTANAS.map((p) => (
                  <button
                    key={p.clave}
                    type="button"
                    role="tab"
                    aria-selected={c.pestana === p.clave}
                    onClick={() => c.setPestana(p.clave)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      c.pestana === p.clave
                        ? 'bg-brand-900 text-white dark:bg-sky-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {p.label} ({c.grupos[p.clave].length})
                  </button>
                ))}
              </div>
              <ListaEventos
                eventos={c.grupos[c.pestana]}
                mostrarTipo={mostrarTipo}
                onEvento={c.editar}
                vacio={PESTANAS.find((p) => p.clave === c.pestana)!.vacio}
              />
            </>
          )}
        </Card>

        {/* Panel lateral: lo pendiente */}
        <PanelProximasFechas grupos={c.grupos} mostrarTipo={mostrarTipo} onEvento={c.editar} onVerTodos={c.verTodosEnLista} />
      </div>

      {c.formulario && (
        <EventoModal
          evento={c.formulario.evento}
          inicial={c.formulario.inicial}
          tiposPermitidos={tipos}
          sugerencias={c.sugerencias}
          onGuardar={c.guardar}
          onEliminar={c.eliminar}
          onCerrar={c.cerrarFormulario}
        />
      )}

      {c.diaAbierto && (
        <ModalDia
          dia={c.diaAbierto}
          eventos={c.eventos}
          mostrarTipo={mostrarTipo}
          onEvento={c.editar}
          onNuevo={c.nuevo}
          onCerrar={() => c.setDiaAbierto(null)}
        />
      )}
    </>
  );
}

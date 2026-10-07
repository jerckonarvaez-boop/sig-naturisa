import { useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cubreDia, estadoVisual, esProximo, fechaCorta, hoyISO, MESES } from '../logic/fechas';
import type { Evento, EventoDatos, TipoEvento } from '../types';
import { useEventos } from '../hooks/useEventos';
import { CalendarioMes } from './CalendarioMes';
import { EventoChip } from './EventoChip';
import { EventoItem } from './EventoItem';
import { EventoModal } from './EventoModal';
import { ListaEventos } from './ListaEventos';

type Vista = 'mes' | 'lista';
type Pestana = 'proximos' | 'vencidos' | 'realizados' | 'todos';

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
  const { eventos, cargando, error, guardar, eliminar } = useEventos(tipos);
  const hoy = new Date();
  const [vista, setVista] = useState<Vista>('mes');
  const [pestana, setPestana] = useState<Pestana>('proximos');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [formulario, setFormulario] = useState<{ evento?: Evento; inicial?: Partial<EventoDatos> } | null>(null);
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);
  const mostrarTipo = tipos.length > 1;

  const grupos = useMemo(() => {
    const iso = hoyISO();
    const porFechaAsc = (a: Evento, b: Evento) => a.fechaInicio.localeCompare(b.fechaInicio);
    const porFechaDesc = (a: Evento, b: Evento) => b.fechaInicio.localeCompare(a.fechaInicio);
    return {
      proximos: eventos.filter((e) => esProximo(e, iso)).sort(porFechaAsc),
      vencidos: eventos.filter((e) => estadoVisual(e, iso) === 'vencido').sort(porFechaAsc),
      realizados: eventos.filter((e) => e.estado === 'realizado').sort(porFechaDesc),
      todos: [...eventos].sort(porFechaDesc),
    };
  }, [eventos]);

  const sugerencias = useMemo(() => {
    const unicos = (valores: string[]) => [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    return {
      sucursales: unicos(eventos.map((e) => e.sucursal)),
      responsables: unicos(eventos.map((e) => e.responsable)),
    };
  }, [eventos]);

  const moverMes = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };
  const irAHoy = () => {
    setAnio(hoy.getFullYear());
    setMes(hoy.getMonth());
  };

  const nuevo = (fechaInicio?: string) => setFormulario({ inicial: { fechaInicio: fechaInicio ?? hoyISO() } });
  const editar = (evento: Evento) => {
    setDiaAbierto(null);
    setFormulario({ evento });
  };

  const PESTANAS: { clave: Pestana; label: string; vacio: string }[] = [
    { clave: 'proximos', label: 'Próximos', vacio: 'No hay fechas programadas.' },
    { clave: 'vencidos', label: 'Vencidos', vacio: 'No hay eventos vencidos.' },
    { clave: 'realizados', label: 'Realizados', vacio: 'Aún no hay eventos realizados.' },
    { clave: 'todos', label: 'Todos', vacio: 'Aún no hay eventos registrados.' },
  ];

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card compact>
          {/* Barra superior */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-base font-semibold">{titulo}</h2>
            {vista === 'mes' && (
              <div className="flex items-center gap-1">
                <BotonIcono etiqueta="Mes anterior" onClick={() => moverMes(-1)}>
                  <ChevronLeft size={16} />
                </BotonIcono>
                <span className="min-w-36 text-center text-sm font-semibold">
                  {MESES[mes]} {anio}
                </span>
                <BotonIcono etiqueta="Mes siguiente" onClick={() => moverMes(1)}>
                  <ChevronRight size={16} />
                </BotonIcono>
                <button
                  type="button"
                  onClick={irAHoy}
                  className="ml-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Hoy
                </button>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700" role="tablist" aria-label="Vista">
                <BotonVista activo={vista === 'mes'} onClick={() => setVista('mes')} icono={<CalendarDays size={14} />} texto="Mes" />
                <BotonVista activo={vista === 'lista'} onClick={() => setVista('lista')} icono={<List size={14} />} texto="Lista" />
              </div>
              <button
                type="button"
                onClick={() => nuevo()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-sky-600 dark:hover:bg-sky-500"
              >
                <Plus size={15} /> Nuevo evento
              </button>
            </div>
          </div>

          {error && <p className="mb-2 text-sm text-red-600">No se pudieron cargar los eventos: {error}</p>}

          {vista === 'mes' ? (
            <div className={cargando ? 'opacity-60' : ''}>
              <CalendarioMes
                anio={anio}
                mes={mes}
                eventos={eventos}
                mostrarTipo={mostrarTipo}
                onDia={nuevo}
                onEvento={editar}
                onVerDia={setDiaAbierto}
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
                    aria-selected={pestana === p.clave}
                    onClick={() => setPestana(p.clave)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      pestana === p.clave
                        ? 'bg-brand-900 text-white dark:bg-sky-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {p.label} ({grupos[p.clave].length})
                  </button>
                ))}
              </div>
              <ListaEventos
                eventos={grupos[pestana]}
                mostrarTipo={mostrarTipo}
                onEvento={editar}
                vacio={PESTANAS.find((p) => p.clave === pestana)!.vacio}
              />
            </>
          )}
        </Card>

        {/* Panel lateral: lo pendiente */}
        <Card compact title="Próximas fechas" className="self-start">
          <Contadores proximos={grupos.proximos.length} vencidos={grupos.vencidos.length} realizados={grupos.realizados.length} />
          {grupos.vencidos.length > 0 && (
            <div className="mb-2">
              {grupos.vencidos.slice(0, 3).map((e) => (
                <EventoItem key={e.id} evento={e} mostrarTipo={mostrarTipo} onClick={editar} />
              ))}
            </div>
          )}
          {grupos.proximos.length ? (
            grupos.proximos.slice(0, 6).map((e) => <EventoItem key={e.id} evento={e} mostrarTipo={mostrarTipo} onClick={editar} />)
          ) : (
            <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No hay fechas programadas.</p>
          )}
          {(grupos.proximos.length > 6 || grupos.vencidos.length > 3) && (
            <button
              type="button"
              onClick={() => {
                setVista('lista');
                setPestana(grupos.vencidos.length > 3 ? 'vencidos' : 'proximos');
              }}
              className="mt-1 ml-2 text-xs font-semibold text-brand-500 hover:underline"
            >
              Ver todos en la lista
            </button>
          )}
        </Card>
      </div>

      {formulario && (
        <EventoModal
          evento={formulario.evento}
          inicial={formulario.inicial}
          tiposPermitidos={tipos}
          sugerencias={sugerencias}
          onGuardar={guardar}
          onEliminar={eliminar}
          onCerrar={() => setFormulario(null)}
        />
      )}

      {diaAbierto && (
        <Modal titulo={`Eventos del ${fechaCorta(diaAbierto)}`} onCerrar={() => setDiaAbierto(null)}>
          <div className="flex flex-col gap-1">
            {eventos
              .filter((e) => cubreDia(e, diaAbierto))
              .map((e) => (
                <EventoChip key={e.id} evento={e} mostrarTipo={mostrarTipo} onClick={editar} />
              ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const dia = diaAbierto;
              setDiaAbierto(null);
              nuevo(dia);
            }}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline"
          >
            <Plus size={14} /> Nuevo evento este día
          </button>
        </Modal>
      )}
    </>
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

function BotonIcono({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="rounded-md p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function BotonVista({ activo, onClick, icono, texto }: { activo: boolean; onClick: () => void; icono: ReactNode; texto: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activo}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
        activo ? 'bg-brand-900 text-white dark:bg-sky-600' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {icono}
      {texto}
    </button>
  );
}

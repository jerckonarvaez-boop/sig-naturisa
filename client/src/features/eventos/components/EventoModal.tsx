import { useState, type FormEvent, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { ESTADOS, ESTADOS_EDITABLES, TIPOS } from '../config';
import type { Evento, EventoDatos, TipoEvento } from '../types';

interface EventoModalProps {
  /** Evento a editar; si no se indica, se crea uno nuevo */
  evento?: Evento;
  /** Valores iniciales para un evento nuevo (ej. la fecha del día pulsado) */
  inicial?: Partial<EventoDatos>;
  tiposPermitidos: TipoEvento[];
  /** Sugerencias para los campos de texto */
  sugerencias: { sucursales: string[]; responsables: string[] };
  onGuardar: (datos: EventoDatos, id?: number) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
  onCerrar: () => void;
}

export function EventoModal({
  evento,
  inicial,
  tiposPermitidos,
  sugerencias,
  onGuardar,
  onEliminar,
  onCerrar,
}: EventoModalProps) {
  const [datos, setDatos] = useState<EventoDatos>(() => ({
    tipo: evento?.tipo ?? inicial?.tipo ?? tiposPermitidos[0],
    titulo: evento?.titulo ?? '',
    fechaInicio: evento?.fechaInicio ?? inicial?.fechaInicio ?? '',
    fechaFin: evento?.fechaFin ?? null,
    sucursal: evento?.sucursal ?? '',
    responsable: evento?.responsable ?? '',
    estado: evento?.estado ?? 'programado',
    observaciones: evento?.observaciones ?? '',
  }));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = <K extends keyof EventoDatos>(campo: K, valor: EventoDatos[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  async function ejecutar(accion: () => Promise<void>) {
    setGuardando(true);
    setError(null);
    try {
      await accion();
      onCerrar();
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    ejecutar(() => onGuardar(datos, evento?.id));
  }

  function borrar() {
    if (evento && window.confirm(`¿Eliminar "${evento.titulo}"? Esta acción no se puede deshacer.`)) {
      ejecutar(() => onEliminar(evento.id));
    }
  }

  return (
    <Modal
      titulo={evento ? 'Editar evento' : 'Nuevo evento'}
      onCerrar={onCerrar}
      pie={
        <>
          {evento && (
            <button
              type="button"
              onClick={borrar}
              disabled={guardando}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 size={15} /> Eliminar
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-evento"
            disabled={guardando}
            className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="form-evento" onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
        {tiposPermitidos.length > 1 && (
          <Campo etiqueta="Tipo" ancho>
            <select value={datos.tipo} onChange={(e) => cambiar('tipo', e.target.value as TipoEvento)} className={CONTROL}>
              {tiposPermitidos.map((t) => (
                <option key={t} value={t}>
                  {TIPOS[t].label}
                </option>
              ))}
            </select>
          </Campo>
        )}

        <Campo etiqueta="Título *" ancho>
          <input
            required
            autoFocus
            maxLength={200}
            value={datos.titulo}
            onChange={(e) => cambiar('titulo', e.target.value)}
            placeholder={tiposPermitidos[0].startsWith('auditoria') ? 'Ej. Auditoría de seguimiento' : 'Ej. Inspección trimestral'}
            className={CONTROL}
          />
        </Campo>

        <Campo etiqueta="Fecha de inicio *">
          <input
            type="date"
            required
            value={datos.fechaInicio}
            onChange={(e) => cambiar('fechaInicio', e.target.value)}
            className={CONTROL}
          />
        </Campo>
        <Campo etiqueta="Fecha de fin (opcional)">
          <input
            type="date"
            min={datos.fechaInicio || undefined}
            value={datos.fechaFin ?? ''}
            onChange={(e) => cambiar('fechaFin', e.target.value || null)}
            className={CONTROL}
          />
        </Campo>

        <Campo etiqueta="Sucursal / lugar">
          <input
            list="sugerencias-sucursal"
            maxLength={120}
            value={datos.sucursal}
            onChange={(e) => cambiar('sucursal', e.target.value)}
            className={CONTROL}
          />
          <datalist id="sugerencias-sucursal">
            {sugerencias.sucursales.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Campo>
        <Campo etiqueta="Responsable">
          <input
            list="sugerencias-responsable"
            maxLength={120}
            value={datos.responsable}
            onChange={(e) => cambiar('responsable', e.target.value)}
            className={CONTROL}
          />
          <datalist id="sugerencias-responsable">
            {sugerencias.responsables.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Campo>

        <Campo etiqueta="Estado" ancho>
          <div className="flex flex-wrap gap-2">
            {ESTADOS_EDITABLES.map((estado) => {
              const { label, icono: Icono, badge } = ESTADOS[estado];
              const activo = datos.estado === estado;
              return (
                <button
                  key={estado}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => cambiar('estado', estado)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    activo ? `${badge} border-transparent ring-2 ring-brand-500` : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icono size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </Campo>

        <Campo etiqueta="Resultado / observaciones" ancho>
          <textarea
            rows={3}
            maxLength={4000}
            value={datos.observaciones}
            onChange={(e) => cambiar('observaciones', e.target.value)}
            placeholder="Hallazgos, no conformidades, acuerdos…"
            className={CONTROL}
          />
        </Campo>

        {error && <p className="text-sm text-red-600 sm:col-span-2 dark:text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

const CONTROL =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950';

function Campo({ etiqueta, ancho, children }: { etiqueta: string; ancho?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${ancho ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{etiqueta}</span>
      {children}
    </label>
  );
}

import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { SelectCentroCosto } from '@/components/forms/SelectCentroCosto';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Modal } from '@/components/ui/Modal';
import { useCatalogo } from '@/hooks/useCatalogo';
import { ESTADOS, ESTADOS_EDITABLES, TIPOS } from '../config';
import type { Evento, EventoDatos, TipoEvento } from '../types';

/** Ejemplo de título según el tipo */
const EJEMPLO_TITULO: Record<TipoEvento, string> = {
  'auditoria-asc': 'Ej. Auditoría de seguimiento ASC',
  'auditoria-bap': 'Ej. Auditoría de recertificación BAP',
  'inspeccion-sci': 'Ej. Inspección trimestral',
  capacitacion: 'Ej. Capacitación en Buenas Prácticas',
  mantenimiento: 'Ej. Calibración de oxigenómetros',
  vencimiento: 'Ej. Renovación del permiso ambiental',
  otro: 'Ej. Reunión con el cliente',
};

/** Fecha y hora local de un instante ISO, ej. "14 oct 2026, 07:30" */
const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

interface EventoModalProps {
  /** Evento a editar; si no se indica, se crea uno nuevo */
  evento?: Evento;
  /** Valores iniciales para un evento nuevo (ej. la fecha del día pulsado) */
  inicial?: Partial<EventoDatos>;
  tiposPermitidos: TipoEvento[];
  /** Sugerencias para los campos de texto */
  sugerencias: { responsables: string[] };
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
    avisar: evento?.avisar ?? true,
  }));
  const { centrosCosto } = useCatalogo();
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
            className={`${BOTON_PRIMARIO} py-2`}
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="form-evento" onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
        {tiposPermitidos.length > 1 && (
          <Campo etiqueta="Tipo" className="sm:col-span-2">
            <select value={datos.tipo} onChange={(e) => cambiar('tipo', e.target.value as TipoEvento)} className={CLASE_CONTROL}>
              {tiposPermitidos.map((t) => (
                <option key={t} value={t}>
                  {TIPOS[t].label}
                </option>
              ))}
            </select>
          </Campo>
        )}

        <Campo etiqueta="Título *" className="sm:col-span-2">
          <input
            required
            autoFocus
            maxLength={200}
            value={datos.titulo}
            onChange={(e) => cambiar('titulo', e.target.value)}
            placeholder={EJEMPLO_TITULO[datos.tipo]}
            className={CLASE_CONTROL}
          />
        </Campo>

        <Campo etiqueta="Fecha de inicio *">
          <input
            type="date"
            required
            value={datos.fechaInicio}
            onChange={(e) => cambiar('fechaInicio', e.target.value)}
            className={CLASE_CONTROL}
          />
        </Campo>
        <Campo etiqueta="Fecha de fin (opcional)">
          <input
            type="date"
            min={datos.fechaInicio || undefined}
            value={datos.fechaFin ?? ''}
            onChange={(e) => cambiar('fechaFin', e.target.value || null)}
            className={CLASE_CONTROL}
          />
        </Campo>

        <Campo etiqueta="Sucursal / centro de costo">
          <SelectCentroCosto value={datos.sucursal} onChange={(v) => cambiar('sucursal', v)} opciones={centrosCosto} />
        </Campo>
        <Campo etiqueta="Responsable">
          <input
            list="sugerencias-responsable"
            maxLength={120}
            value={datos.responsable}
            onChange={(e) => cambiar('responsable', e.target.value)}
            className={CLASE_CONTROL}
          />
          <datalist id="sugerencias-responsable">
            {sugerencias.responsables.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Campo>

        <Campo etiqueta="Estado" className="sm:col-span-2">
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

        <label className="flex items-start gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={datos.avisar}
            onChange={(e) => cambiar('avisar', e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-brand-500"
          />
          <span>
            Avisarme por correo antes del evento
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {evento?.avisar && evento.avisoEnviadoEn
                ? `Aviso enviado el ${fechaHora(evento.avisoEnviadoEn)}. Si cambia la fecha, se vuelve a avisar.`
                : 'Llega a los correos configurados en Calendario ▸ Avisos por correo.'}
            </span>
          </span>
        </label>

        <Campo etiqueta="Resultado / observaciones" className="sm:col-span-2">
          <textarea
            rows={3}
            maxLength={4000}
            value={datos.observaciones}
            onChange={(e) => cambiar('observaciones', e.target.value)}
            placeholder="Hallazgos, no conformidades, acuerdos…"
            className={CLASE_CONTROL}
          />
        </Campo>

        {error && <p className="text-sm text-red-600 sm:col-span-2 dark:text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

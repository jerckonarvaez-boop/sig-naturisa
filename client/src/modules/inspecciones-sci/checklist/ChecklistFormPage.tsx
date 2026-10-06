import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Printer, Save, Trash2 } from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { hoyISO } from '@/features/eventos/fechas';
import { actualizarRevision, crearRevision, eliminarRevision, listarRevisiones, obtenerPlantilla, obtenerRevision } from './api';
import { agruparPorSeccion, contar } from './calculo';
import { BarraCumplimiento, PorcentajeGrande } from './components/Cumplimiento';
import { SeccionChecklist, type RespuestaEditable } from './components/SeccionChecklist';
import type { ItemChecklist } from './types';

const RUTA_LISTA = '/inspecciones-sci/checklist';

/** Formulario para registrar (o editar) una revisión del check list de Buenas Prácticas. */
export function ChecklistFormPage() {
  const { id } = useParams();
  const revisionId = id ? Number(id) : null;
  const navigate = useNavigate();

  const [plantilla, setPlantilla] = useState<ItemChecklist[]>([]);
  const [datos, setDatos] = useState({ fecha: hoyISO(), sucursal: '', responsable: '', observaciones: '' });
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaEditable>>({});
  const [sucursales, setSucursales] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean } | null>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const [items, revisiones, revision] = await Promise.all([
          obtenerPlantilla(),
          listarRevisiones(),
          revisionId ? obtenerRevision(revisionId) : Promise.resolve(null),
        ]);
        if (!vigente) return;
        setPlantilla(items);
        setSucursales([...new Set(revisiones.map((r) => r.sucursal))].sort((a, b) => a.localeCompare(b, 'es')));
        if (revision) {
          setDatos({
            fecha: revision.fecha,
            sucursal: revision.sucursal,
            responsable: revision.responsable,
            observaciones: revision.observaciones,
          });
          setRespuestas(
            Object.fromEntries(revision.respuestas.map((r) => [r.itemId, { respuesta: r.respuesta, observacion: r.observacion }])),
          );
        }
      } catch (e) {
        if (vigente) setMensaje({ texto: (e as Error).message, error: true });
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [revisionId]);

  const secciones = useMemo(() => agruparPorSeccion(plantilla), [plantilla]);
  const conteoGeneral = contar(plantilla.map((i) => respuestas[i.id]?.respuesta ?? null));

  const cambiarRespuesta = (itemId: number, cambio: Partial<RespuestaEditable>) =>
    setRespuestas((r) => {
      const previa: RespuestaEditable = r[itemId] ?? { respuesta: null, observacion: '' };
      return { ...r, [itemId]: { ...previa, ...cambio } };
    });

  async function guardar() {
    if (!datos.sucursal.trim()) {
      setMensaje({ texto: 'Indique la sucursal antes de guardar.', error: true });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    const cuerpo = {
      ...datos,
      respuestas: plantilla.map((i) => ({
        itemId: i.id,
        respuesta: respuestas[i.id]?.respuesta ?? null,
        observacion: respuestas[i.id]?.observacion ?? '',
      })),
    };
    try {
      if (revisionId) {
        await actualizarRevision(revisionId, cuerpo);
        setMensaje({ texto: 'Cambios guardados.' });
      } else {
        const nueva = await crearRevision(cuerpo);
        navigate(`${RUTA_LISTA}/${nueva.id}`, { replace: true });
        setMensaje({ texto: 'Revisión guardada.' });
      }
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!revisionId || !window.confirm('¿Eliminar esta revisión? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarRevision(revisionId);
      navigate(RUTA_LISTA);
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    }
  }

  if (cargando) return <Card className="py-12 text-center text-slate-500">Cargando check list…</Card>;

  return (
    <>
      <PageHeader
        title={revisionId ? `Check list · ${datos.sucursal || 'Revisión'}` : 'Nueva revisión'}
        subtitle="Check list de Buenas Prácticas · revisión previa a la inspección SCI"
        breadcrumb={{ label: 'Check list Buenas Prácticas', to: RUTA_LISTA }}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 pb-20 xl:grid-cols-[minmax(0,1fr)_280px] xl:pb-0 print:pb-0">
        <div className="flex flex-col gap-4">
          <Card compact title="Datos de la revisión">
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo etiqueta="Fecha *">
                <input type="date" required value={datos.fecha} onChange={(e) => setDatos({ ...datos, fecha: e.target.value })} className={CONTROL} />
              </Campo>
              <Campo etiqueta="Sucursal / finca *">
                <input
                  list="sucursales-checklist"
                  required
                  maxLength={120}
                  value={datos.sucursal}
                  onChange={(e) => setDatos({ ...datos, sucursal: e.target.value })}
                  placeholder="Ej. Fincacua"
                  className={CONTROL}
                />
                <datalist id="sucursales-checklist">
                  {sucursales.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Campo>
              <Campo etiqueta="Responsable">
                <input maxLength={120} value={datos.responsable} onChange={(e) => setDatos({ ...datos, responsable: e.target.value })} className={CONTROL} />
              </Campo>
              <Campo etiqueta="Observaciones generales" ancho>
                <textarea
                  rows={2}
                  maxLength={4000}
                  value={datos.observaciones}
                  onChange={(e) => setDatos({ ...datos, observaciones: e.target.value })}
                  className={CONTROL}
                />
              </Campo>
            </div>
          </Card>

          {secciones.map((s) => (
            <SeccionChecklist key={s.seccion} seccion={s.seccion} items={s.items} respuestas={respuestas} onCambiar={cambiarRespuesta} />
          ))}
        </div>

        {/* Resumen fijo mientras se recorre el formulario */}
        <aside className="xl:sticky xl:top-0 xl:self-start">
          <Card compact title="Cumplimiento general">
            <PorcentajeGrande conteo={conteoGeneral} />
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {conteoGeneral.total - conteoGeneral.sinResponder} de {conteoGeneral.total} respondidos · {conteoGeneral.si} SI ·{' '}
              {conteoGeneral.no} NO · {conteoGeneral.na} N/A
            </p>

            <h3 className="mb-1 text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">Por área</h3>
            <dl className="mb-4 space-y-2">
              {secciones.map((s) => (
                <div key={s.seccion}>
                  <dt className="truncate text-xs" title={s.seccion}>
                    {s.seccion}
                  </dt>
                  <dd>
                    <BarraCumplimiento conteo={contar(s.items.map((i) => respuestas[i.id]?.respuesta ?? null))} />
                  </dd>
                </div>
              ))}
            </dl>

            {mensaje && (
              <p
                role="status"
                className={`mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                  mensaje.error
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                }`}
              >
                {!mensaje.error && <CheckCircle2 size={14} />}
                {mensaje.texto}
              </p>
            )}

            <div className="flex flex-col gap-2 print:hidden">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
              >
                <Save size={15} /> {guardando ? 'Guardando…' : 'Guardar revisión'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <Printer size={14} /> Imprimir
                </button>
                {revisionId && (
                  <button
                    type="button"
                    onClick={eliminar}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                )}
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* Barra fija en móvil/tablet: cumplimiento y botón Guardar siempre a mano */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] xl:hidden dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <div className="min-w-0 flex-1">
          {mensaje ? (
            <p className={`truncate text-xs font-semibold ${mensaje.error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {mensaje.texto}
            </p>
          ) : (
            <>
              <BarraCumplimiento conteo={conteoGeneral} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {conteoGeneral.total - conteoGeneral.sinResponder}/{conteoGeneral.total} respondidos
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-sky-600"
        >
          <Save size={15} /> {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </>
  );
}

const CONTROL =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950';

function Campo({ etiqueta, ancho, children }: { etiqueta: string; ancho?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${ancho ? 'sm:col-span-3' : ''}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{etiqueta}</span>
      {children}
    </label>
  );
}

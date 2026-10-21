import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, FileText, Paperclip, Save, Trash2, X } from 'lucide-react';
import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { hoyISO } from '@/utils/fechas';
import { EditorParametros } from '../components/EditorParametros';
import { SelectorSitios } from '../components/SelectorSitios';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { parametrosIniciales } from '../logic/monitoreo';
import { PUNTOS_MONITOREO, REPORTES_AGUA, RESULTADOS_AGUA, type PuntoMonitoreo } from '../meta';
import {
  actualizarResultado,
  crearResultado,
  eliminarResultado,
  obtenerResultado,
  quitarPdf,
  subirPdf,
  urlPdf,
} from '../services/monitoreo.api';
import type { Resultado, ResultadoDatos } from '../types';

const MAX_PDF = 8 * 1024 * 1024;

const vacio = (punto: PuntoMonitoreo): ResultadoDatos => ({
  punto,
  laboratorio: '',
  codigo: '',
  fechaMuestreo: hoyISO(),
  fechaEmision: '',
  locacion: '',
  norte: '',
  este: '',
  metodo: 'Simple',
  muestreoTercero: false,
  sitios: [],
  valores: [],
  observaciones: '',
});

/** Registrar o editar un resultado del laboratorio (afluente o efluente) con su PDF original. */
export function ResultadoPage() {
  const params = useParams();
  const punto = PUNTOS_MONITOREO.find((p) => p.id === params.punto);
  const id = params.id ? Number(params.id) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const { definicion, sitios, resultados, error: errorDatos } = useMonitoreo(punto?.id);
  const [form, setForm] = useState<ResultadoDatos | null>(null);
  const [guardado, setGuardado] = useState<Resultado | null>(null);
  const [pdfNuevo, setPdfNuevo] = useState<File | null>(null);
  // Al crear se abre la ruta del resultado nuevo: el aviso de guardado llega en el estado de la navegación
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean } | null>(() =>
    (location.state as { guardado?: boolean } | null)?.guardado ? { texto: 'Resultado guardado.' } : null,
  );
  const [guardando, setGuardando] = useState(false);
  /** En un resultado nuevo, los parámetros siguen al tipo de instalación hasta que se escribe un valor */
  const parametrosTocados = useRef(false);
  const archivo = useRef<HTMLInputElement>(null);

  // Carga el resultado (o prepara uno nuevo con los parámetros por defecto)
  useEffect(() => {
    if (!punto || !definicion || !sitios) return;
    if (!id) {
      setForm((f) => f ?? { ...vacio(punto.id), valores: parametrosIniciales(definicion, punto.id, []).map((clave) => ({ clave, valor: '' })) });
      return;
    }
    obtenerResultado(id)
      .then((r) => {
        setGuardado(r);
        setForm({ ...r });
        parametrosTocados.current = true;
      })
      .catch((e: Error) => setMensaje({ texto: e.message, error: true }));
  }, [id, punto, definicion, sitios]);

  // Sugerencias de laboratorio y punto de muestreo a partir de lo ya registrado
  const sugerencias = useMemo(
    () => ({
      laboratorios: [...new Set((resultados ?? []).map((r) => r.laboratorio).filter(Boolean))],
      locaciones: [...new Set((resultados ?? []).map((r) => r.locacion).filter(Boolean))],
    }),
    [resultados],
  );

  if (!punto) return <Navigate to={RESULTADOS_AGUA.path} replace />;
  if (errorDatos) return <Card className="py-12 text-center text-red-600">No se pudo cargar: {errorDatos}</Card>;
  if (!form || !definicion || !sitios) {
    return (
      <Card className={`py-12 text-center ${mensaje?.error ? 'text-red-600' : 'text-slate-500'}`}>
        {mensaje?.error ? mensaje.texto : 'Cargando…'}
      </Card>
    );
  }

  const cambiar = <K extends keyof ResultadoDatos>(campo: K, valor: ResultadoDatos[K]) => setForm((f) => f && { ...f, [campo]: valor });

  const cambiarSitios = (ids: number[]) => {
    setForm((f) => {
      if (!f) return f;
      if (parametrosTocados.current || f.valores.some((v) => v.valor)) return { ...f, sitios: ids };
      const elegidos = sitios.filter((s) => ids.includes(s.id));
      return { ...f, sitios: ids, valores: parametrosIniciales(definicion, punto.id, elegidos).map((clave) => ({ clave, valor: '' })) };
    });
  };

  const elegirPdf = (f: File | undefined) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) setMensaje({ texto: 'El archivo debe ser PDF.', error: true });
    else if (f.size > MAX_PDF) setMensaje({ texto: 'El PDF pesa más de 8 MB.', error: true });
    else {
      setPdfNuevo(f);
      setMensaje(null);
    }
    if (archivo.current) archivo.current.value = '';
  };

  async function guardar() {
    if (!form) return;
    setGuardando(true);
    setMensaje(null);
    try {
      let r = id ? await actualizarResultado(id, form) : await crearResultado(form);
      if (pdfNuevo) r = await subirPdf(r.id, pdfNuevo);
      setPdfNuevo(null);
      setGuardado(r);
      setForm({ ...r });
      parametrosTocados.current = true;
      setMensaje({ texto: 'Resultado guardado.' });
      if (!id) navigate(`${RESULTADOS_AGUA.path}/${punto!.id}/${r.id}`, { replace: true, state: { guardado: true } });
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!id || !window.confirm('¿Eliminar este resultado y su PDF? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarResultado(id);
      navigate(`${RESULTADOS_AGUA.path}/${punto!.id}`);
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    }
  }

  async function borrarPdf() {
    if (!id || !window.confirm('¿Quitar el PDF del laboratorio de este resultado?')) return;
    try {
      await quitarPdf(id);
      setGuardado((g) => g && { ...g, pdf: null });
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    }
  }

  const acciones = (
    <div className="flex flex-wrap items-center gap-2">
      {id && (
        <button
          type="button"
          onClick={eliminar}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <Trash2 size={15} /> Eliminar
        </button>
      )}
      {id && punto.id === 'efluente' && (
        <Link
          to={`${REPORTES_AGUA.path}/efluente`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <FileText size={15} /> Ver informes
        </Link>
      )}
      <button type="button" onClick={guardar} disabled={guardando} className={`${BOTON_PRIMARIO} inline-flex items-center gap-2 py-2`}>
        <Save size={15} /> {guardando ? 'Guardando…' : 'Guardar resultado'}
      </button>
    </div>
  );

  return (
    <>
      <PageHeader
        title={id ? `${form.codigo || 'Resultado'} · ${punto.label}` : `Nuevo resultado · ${punto.label}`}
        subtitle={punto.description}
        breadcrumb={{ label: `${RESULTADOS_AGUA.label} · ${punto.label}`, to: `${RESULTADOS_AGUA.path}/${punto.id}` }}
        actions={acciones}
      />

      {mensaje && (
        <p
          role="status"
          className={`mb-4 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold ${
            mensaje.error
              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
          }`}
        >
          {!mensaje.error && <CheckCircle2 size={15} />}
          {mensaje.texto}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Card title="Informe del laboratorio">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Campo etiqueta="Laboratorio">
              <input list="mon-laboratorios" maxLength={120} value={form.laboratorio} onChange={(e) => cambiar('laboratorio', e.target.value)} placeholder="Ej. ELICROM" className={CLASE_CONTROL} />
              <datalist id="mon-laboratorios">
                {sugerencias.laboratorios.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </Campo>
            <Campo etiqueta="Código del informe">
              <input maxLength={60} value={form.codigo} onChange={(e) => cambiar('codigo', e.target.value)} placeholder="Ej. WGE-0000-000-26" className={CLASE_CONTROL} />
            </Campo>
            <Campo etiqueta="Fecha de muestreo *">
              <input type="date" required value={form.fechaMuestreo} onChange={(e) => cambiar('fechaMuestreo', e.target.value)} className={CLASE_CONTROL} />
            </Campo>
            <Campo etiqueta="Fecha de emisión">
              <input type="date" value={form.fechaEmision} onChange={(e) => cambiar('fechaEmision', e.target.value)} className={CLASE_CONTROL} />
            </Campo>
            <Campo etiqueta="Punto de muestreo (locación)" className="sm:col-span-2">
              <input
                list="mon-locaciones"
                maxLength={300}
                value={form.locacion}
                onChange={(e) => cambiar('locacion', e.target.value)}
                placeholder={punto.id === 'efluente' ? 'Ej. Golfomar/Servitron – Drenaje Piscina 1' : 'Ej. Estero – Estación de Bombeo'}
                className={CLASE_CONTROL}
              />
              <datalist id="mon-locaciones">
                {sugerencias.locaciones.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </Campo>
            <Campo etiqueta="Coordenada Norte">
              <input maxLength={30} inputMode="numeric" value={form.norte} onChange={(e) => cambiar('norte', e.target.value)} placeholder="Ej. 9700000" className={CLASE_CONTROL} />
            </Campo>
            <Campo etiqueta="Coordenada Este">
              <input maxLength={30} inputMode="numeric" value={form.este} onChange={(e) => cambiar('este', e.target.value)} placeholder="Ej. 600000" className={CLASE_CONTROL} />
            </Campo>
            <Campo etiqueta="Tipo de muestreo">
              <input maxLength={60} value={form.metodo} onChange={(e) => cambiar('metodo', e.target.value)} placeholder="Simple" className={CLASE_CONTROL} />
            </Campo>
            <label className="flex items-center gap-2 self-end pb-1.5 text-sm sm:col-span-1 lg:col-span-3">
              <input type="checkbox" checked={form.muestreoTercero} onChange={(e) => cambiar('muestreoTercero', e.target.checked)} className="size-4" />
              La muestra la tomó el laboratorio (si no, la tomó Naturisa)
            </label>
          </div>
        </Card>

        <Card
          title="Camaroneras / instalaciones *"
          subtitle={punto.id === 'efluente' ? 'Se genera un informe PGC-025 por cada una' : 'Para el Apéndice X (ASC) de cada camaronera'}
        >
          <SelectorSitios sitios={sitios} elegidos={form.sitios} onCambiar={cambiarSitios} />
        </Card>

        <Card title="Resultados" subtitle={punto.id === 'efluente' ? 'Comparados con el AM 097a, Tabla 10 (descarga a cuerpo de agua marina)' : undefined}>
          <EditorParametros
            definicion={definicion}
            punto={punto.id}
            valores={form.valores}
            onCambiar={(v) => {
              parametrosTocados.current = true;
              cambiar('valores', v);
            }}
          />
        </Card>

        <Card title="PDF del laboratorio" subtitle="El informe original, firmado por el laboratorio (máx. 8 MB)">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {guardado?.pdf && !pdfNuevo && (
              <>
                <a href={urlPdf(guardado.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-brand-500 hover:underline">
                  <FileText size={16} /> {guardado.pdf.nombre}
                </a>
                <span className="text-xs text-slate-500">({Math.round(guardado.pdf.tamano / 1024)} KB)</span>
                <button type="button" onClick={borrarPdf} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline dark:text-red-400">
                  <X size={13} /> Quitar
                </button>
              </>
            )}
            {pdfNuevo && (
              <span className="inline-flex items-center gap-1.5">
                <Paperclip size={15} /> {pdfNuevo.name} <span className="text-xs text-slate-500">(se sube al guardar)</span>
                <button type="button" onClick={() => setPdfNuevo(null)} aria-label="No adjuntar" className="rounded p-0.5 text-slate-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => archivo.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Paperclip size={15} /> {guardado?.pdf || pdfNuevo ? 'Reemplazar PDF' : 'Adjuntar PDF'}
            </button>
            <input ref={archivo} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => elegirPdf(e.target.files?.[0])} />
          </div>
        </Card>

        <Card title="Observaciones">
          <textarea rows={2} maxLength={2000} value={form.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} className={CLASE_CONTROL} />
        </Card>
      </div>
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileText, FileUp, Paperclip, Plus, Save, Trash2, X } from 'lucide-react';
import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { fechaCorta, hoyISO } from '@/utils/fechas';
import { EditorParametros } from '../components/EditorParametros';
import { SelectorSitios } from '../components/SelectorSitios';
import { VistaPdf } from '../components/VistaPdf';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { leerInformeLaboratorio, sugerirDatos } from '../logic/lecturaPdf';
import { parametroDe, parametrosIniciales } from '../logic/monitoreo';
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
import { textoDePdf } from '../services/pdfjs';
import type { DefinicionMonitoreo, Resultado, ResultadoDatos, ValorParametro } from '../types';

const MAX_PDF = 8 * 1024 * 1024;

/** Lo que se sacó del PDF del laboratorio, para que el usuario sepa qué revisar */
type AvisoLectura =
  | { error: string }
  | {
      codigo: string;
      laboratorio: string;
      leidos: number;
      /** Parámetros del informe que el PDF no trae */
      faltan: string[];
      /** Parámetros que trae el PDF y no van en el informe de estas camaroneras */
      extras: ValorParametro[];
      previo: Resultado | null;
      repetido: Resultado | null;
      sinSitios: boolean;
    };

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
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState<AvisoLectura | null>(null);
  /** PDF elegido en la lista de resultados con «Subir PDF del laboratorio» */
  const pdfDeLaLista = useRef((location.state as { pdf?: File } | null)?.pdf ?? null);
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

  // Lee el PDF que llegó desde la lista en cuanto el formulario nuevo está listo
  const listo = !id && !!form;
  useEffect(() => {
    const pdf = pdfDeLaLista.current;
    if (!listo || !pdf) return;
    pdfDeLaLista.current = null;
    elegirPdf(pdf);
  }, [listo]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function elegirPdf(f: File | undefined) {
    if (archivo.current) archivo.current.value = '';
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) return setMensaje({ texto: 'El archivo debe ser PDF.', error: true });
    if (f.size > MAX_PDF) return setMensaje({ texto: 'El PDF pesa más de 8 MB.', error: true });
    setPdfNuevo(f);
    setMensaje(null);
    // En un resultado nuevo, los datos se llenan con lo que dice el PDF
    if (!id) void leerPdf(f);
  }

  /** Llena el formulario con el informe del laboratorio: datos, camaroneras y parámetros */
  async function leerPdf(f: File) {
    setLeyendo(true);
    setAviso(null);
    try {
      const lectura = leerInformeLaboratorio(await textoDePdf(f));
      if (!lectura) {
        setAviso({ error: 'No se reconoció el informe (se leen los de ELICROM y LAB-PSI). El PDF queda adjunto: llene los datos a mano.' });
        return;
      }
      const { previo, datos } = sugerirDatos(lectura, f.name, punto!.id, sitios!, resultados ?? []);
      const base = parametrosIniciales(definicion!, punto!.id, sitios!.filter((s) => datos.sitios.includes(s.id)));
      const valores = base.map((clave) => ({ clave, valor: lectura.valores.find((v) => v.clave === clave)?.valor ?? '' }));
      parametrosTocados.current = true;
      setForm(
        (actual) =>
          actual && {
            ...actual,
            laboratorio: lectura.laboratorio,
            codigo: lectura.codigo,
            fechaMuestreo: lectura.fechaMuestreo || actual.fechaMuestreo,
            fechaEmision: lectura.fechaEmision,
            metodo: lectura.metodo,
            muestreoTercero: lectura.muestreoTercero,
            ...datos,
            valores,
          },
      );
      setAviso({
        codigo: lectura.codigo,
        laboratorio: lectura.laboratorio,
        leidos: valores.filter((v) => v.valor).length,
        faltan: valores.filter((v) => !v.valor).map((v) => parametroDe(definicion!, v.clave)?.nombre ?? v.clave),
        extras: lectura.valores.filter((v) => !base.includes(v.clave)),
        previo,
        repetido: (resultados ?? []).find((r) => lectura.codigo && r.codigo === lectura.codigo) ?? null,
        sinSitios: !datos.sitios.length,
      });
    } catch (e) {
      setAviso({ error: `No se pudo leer el PDF (${(e as Error).message}). Queda adjunto: llene los datos a mano.` });
    } finally {
      setLeyendo(false);
    }
  }

  const agregarExtras = (extras: ValorParametro[]) => {
    setForm((f) => f && { ...f, valores: [...f.valores, ...extras] });
    setAviso((a) => (a && !('error' in a) ? { ...a, leidos: a.leidos + extras.length, extras: [] } : a));
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

      {/* En pantallas anchas, el PDF queda al lado del formulario para comparar los valores */}
      <div className={`grid items-start gap-4 ${pdfNuevo || guardado?.pdf ? '2xl:grid-cols-2' : ''}`}>
        <div className="flex min-w-0 flex-col gap-4">
          {!id && !pdfNuevo && (
            <button
              type="button"
              onClick={() => archivo.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                elegirPdf(e.dataTransfer.files[0]);
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-brand-500/50 bg-brand-500/5 px-4 py-8 text-center hover:border-brand-500 hover:bg-brand-500/10"
            >
              <FileUp size={32} className="text-brand-500" />
              <span className="font-semibold">Subir el PDF del laboratorio</span>
              <span className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                Pulse o arrastre aquí el informe de ELICROM o LAB-PSI: el código, las fechas, las camaroneras y los parámetros se llenan
                solos.
              </span>
            </button>
          )}

          {leyendo && <Card className="py-6 text-center text-slate-500">Leyendo el PDF…</Card>}

          {aviso && <AvisoPdf aviso={aviso} definicion={definicion} punto={punto.id} onAgregar={agregarExtras} />}

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
        {(pdfNuevo || guardado?.pdf) && (
          <VistaPdf
            key={pdfNuevo ? `nuevo-${pdfNuevo.name}-${pdfNuevo.size}` : `guardado-${guardado!.pdf!.nombre}-${guardado!.pdf!.tamano}`}
            origen={pdfNuevo ?? urlPdf(guardado!.id)}
            className="min-w-0 2xl:sticky 2xl:top-4"
          />
        )}
      </div>
    </>
  );
}

/** Resumen de lo leído del PDF: qué se llenó, de dónde salieron las camaroneras y qué falta revisar */
function AvisoPdf({
  aviso,
  definicion,
  punto,
  onAgregar,
}: {
  aviso: AvisoLectura;
  definicion: DefinicionMonitoreo;
  punto: PuntoMonitoreo;
  onAgregar: (extras: ValorParametro[]) => void;
}) {
  if ('error' in aviso) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {aviso.error}
      </p>
    );
  }
  const nombre = (clave: string) => parametroDe(definicion, clave)?.nombre ?? clave;
  return (
    <div role="status" className="flex flex-col gap-1.5 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:bg-sky-500/10 dark:text-sky-100">
      <p className="flex items-start gap-1.5 font-semibold">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        Se leyó el informe {aviso.codigo} de {aviso.laboratorio}: {aviso.leidos} {aviso.leidos === 1 ? 'parámetro' : 'parámetros'}. Revise los datos y
        pulse «Guardar resultado».
      </p>
      {aviso.repetido && (
        <p className="font-semibold text-red-700 dark:text-red-300">
          Este código ya está registrado:{' '}
          <Link to={`${RESULTADOS_AGUA.path}/${punto}/${aviso.repetido.id}`} className="underline">
            abrir el resultado {aviso.repetido.codigo}
          </Link>
          .
        </p>
      )}
      <p>
        {aviso.previo
          ? `Camaroneras, punto de muestreo y coordenadas tomados del resultado anterior del mismo punto (${aviso.previo.codigo || 'sin código'}, ${fechaCorta(aviso.previo.fechaMuestreo)}).`
          : aviso.sinSitios
            ? 'No se reconocieron las camaroneras: márquelas abajo.'
            : 'Camaroneras sugeridas por el nombre del punto de muestreo: revíselas abajo.'}
      </p>
      {aviso.faltan.length > 0 && <p>No vienen en el PDF: {aviso.faltan.join(', ')}.</p>}
      {aviso.extras.length > 0 && (
        <p>
          También vienen en el PDF, aunque no van en el informe de estas camaroneras:{' '}
          {aviso.extras.map((v) => `${nombre(v.clave)} ${v.valor}`).join(' · ')}.{' '}
          <button type="button" onClick={() => onAgregar(aviso.extras)} className="inline-flex items-center gap-1 font-semibold text-brand-500 hover:underline">
            <Plus size={13} /> Agregarlos
          </button>
        </p>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileDown, FileText, Pencil, PenLine, Printer } from 'lucide-react';
import { descargar } from '@/services/documentos/correo';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EditorTextosInforme } from '../components/informe/EditorTextosInforme';
import { InformeMonitoreo } from '../components/informe/InformeMonitoreo';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { datosDelInforme } from '../logic/informe';
import { nombreArchivoInforme } from '../logic/monitoreo';
import { FICHAS_TECNICAS, REPORTES_AGUA, RESULTADOS_AGUA } from '../meta';
import { informeAWord } from '../services/informeWord';
import { guardarEdicionInforme, obtenerResultado, urlPdf } from '../services/monitoreo.api';
import type { EdicionInforme, Resultado } from '../types';

const BOTON = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800';

/** Informe PGC-025 de una camaronera, listo para imprimir, guardar en PDF o descargar en Word; sus textos se pueden corregir. */
export function InformeMonitoreoPage() {
  const { resultadoId, sitioId } = useParams();
  const { definicion, sitios, error: errorDatos } = useMonitoreo('efluente');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generandoWord, setGenerandoWord] = useState(false);
  const [errorWord, setErrorWord] = useState<string | null>(null);
  /** Textos que se están corrigiendo (null = no se está editando) */
  const [borrador, setBorrador] = useState<EdicionInforme | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean } | null>(null);

  useEffect(() => {
    obtenerResultado(Number(resultadoId))
      .then(setResultado)
      .catch((e: Error) => setError(e.message));
  }, [resultadoId]);

  const sitio = sitios?.find((s) => s.id === Number(sitioId));

  // El título de la pestaña es el nombre que propone el navegador al "Guardar como PDF"
  useEffect(() => {
    if (!sitio || !resultado) return;
    const anterior = document.title;
    document.title = nombreArchivoInforme(sitio, resultado);
    return () => {
      document.title = anterior;
    };
  }, [sitio, resultado]);
  const volver = { label: `${REPORTES_AGUA.label} · Efluente`, to: `${REPORTES_AGUA.path}/efluente` };

  if (error || errorDatos) return <Card className="py-12 text-center text-red-600">No se pudo cargar el informe: {error ?? errorDatos}</Card>;
  if (!resultado || !definicion || !sitios) return <Card className="py-12 text-center text-slate-500">Cargando informe…</Card>;
  if (!sitio || !resultado.sitios.includes(sitio.id)) {
    return <Card className="py-12 text-center text-red-600">Esta camaronera no está incluida en el resultado del laboratorio.</Card>;
  }

  const descargarWord = async () => {
    setGenerandoWord(true);
    setErrorWord(null);
    try {
      descargar(await informeAWord(sitio, resultado, definicion, borrador ?? undefined), `${nombreArchivoInforme(sitio, resultado)}.docx`);
    } catch (e) {
      setErrorWord(`No se pudo generar el Word: ${(e as Error).message}`);
    } finally {
      setGenerandoWord(false);
    }
  };

  const guardarTextos = async () => {
    if (!borrador) return;
    setGuardando(true);
    setMensaje(null);
    try {
      setResultado(await guardarEdicionInforme(resultado.id, sitio.id, borrador));
      setBorrador(null);
      setMensaje({ texto: 'Textos del informe guardados.' });
    } catch (e) {
      setMensaje({ texto: `No se pudieron guardar los textos: ${(e as Error).message}`, error: true });
    } finally {
      setGuardando(false);
    }
  };

  const informe = <InformeMonitoreo sitio={sitio} resultado={resultado} definicion={definicion} edicion={borrador ?? undefined} />;

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={`${sitio.numero}. ${sitio.nombre}`}
          subtitle={`Informe de Monitoreo PGC-025 · ${resultado.codigo || 'sin código del laboratorio'}`}
          breadcrumb={volver}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link to={FICHAS_TECNICAS.path} className={BOTON} title="Corregir la ficha técnica de la camaronera">
                <Pencil size={15} /> Ficha técnica
              </Link>
              <Link to={`${RESULTADOS_AGUA.path}/efluente/${resultado.id}`} className={BOTON} title="Corregir los datos del laboratorio">
                <Pencil size={15} /> Resultado
              </Link>
              {resultado.pdf && (
                <a href={urlPdf(resultado.id)} target="_blank" rel="noreferrer" className={BOTON}>
                  <FileText size={15} /> PDF del laboratorio
                </a>
              )}
              {!borrador && (
                <button
                  type="button"
                  onClick={() => {
                    setBorrador({ ...resultado.ediciones?.[sitio.id] });
                    setMensaje(null);
                  }}
                  className={BOTON}
                  title="Corregir los textos de este informe"
                >
                  <PenLine size={15} /> Editar textos
                </button>
              )}
              <button type="button" onClick={descargarWord} disabled={generandoWord} className={`${BOTON} disabled:opacity-50`} title="Descargar el informe en Word (.docx) con el mismo formato">
                <FileDown size={15} /> {generandoWord ? 'Generando…' : 'Descargar Word'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-sky-600"
              >
                <Printer size={15} /> Imprimir / PDF
              </button>
            </div>
          }
        />
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Para guardarlo en PDF: Imprimir ▸ Destino «Guardar como PDF». Para cambiar los textos: «Editar textos» (salen igual en el PDF
          y el Word). Adjunte como anexo el PDF del laboratorio.
        </p>
        {errorWord && <p className="mb-3 text-sm font-semibold text-red-600">{errorWord}</p>}
        {mensaje && (
          <p role="status" className={`mb-3 text-sm font-semibold ${mensaje.error ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {mensaje.texto}
          </p>
        )}
      </div>
      {borrador ? (
        // Editor al lado del documento en pantallas anchas (encima en las angostas); el documento cambia al escribir
        <div className="grid gap-4 2xl:grid-cols-[minmax(320px,1fr)_auto]">
          <div className="print:hidden 2xl:sticky 2xl:top-4 2xl:max-h-[calc(100vh-2rem)] 2xl:overflow-y-auto">
            <EditorTextosInforme
              automaticos={datosDelInforme(sitio, resultado, definicion, {}).automaticos}
              edicion={borrador}
              onCambiar={setBorrador}
              onGuardar={guardarTextos}
              onCancelar={() => setBorrador(null)}
              guardando={guardando}
            />
          </div>
          <div className="pgc-marco min-w-0">{informe}</div>
        </div>
      ) : (
        <div className="pgc-marco">{informe}</div>
      )}
    </>
  );
}

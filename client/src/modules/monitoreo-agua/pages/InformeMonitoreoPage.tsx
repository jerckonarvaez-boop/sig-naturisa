import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileDown, FileText, Pencil, Printer } from 'lucide-react';
import { descargar } from '@/services/documentos/correo';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { InformeMonitoreo } from '../components/informe/InformeMonitoreo';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { nombreArchivoInforme } from '../logic/monitoreo';
import { FICHAS_TECNICAS, REPORTES_AGUA, RESULTADOS_AGUA } from '../meta';
import { informeAWord } from '../services/informeWord';
import { obtenerResultado, urlPdf } from '../services/monitoreo.api';
import type { Resultado } from '../types';

const BOTON = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800';

/** Informe PGC-025 de una camaronera, listo para imprimir o guardar en PDF. */
export function InformeMonitoreoPage() {
  const { resultadoId, sitioId } = useParams();
  const { definicion, sitios, error: errorDatos } = useMonitoreo('efluente');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generandoWord, setGenerandoWord] = useState(false);
  const [errorWord, setErrorWord] = useState<string | null>(null);

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
      descargar(await informeAWord(sitio, resultado, definicion), `${nombreArchivoInforme(sitio, resultado)}.docx`);
    } catch (e) {
      setErrorWord(`No se pudo generar el Word: ${(e as Error).message}`);
    } finally {
      setGenerandoWord(false);
    }
  };

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
          Para guardarlo en PDF: Imprimir ▸ Destino «Guardar como PDF». Para editarlo: «Descargar Word». Adjunte como anexo el PDF del
          laboratorio.
        </p>
        {errorWord && <p className="mb-3 text-sm font-semibold text-red-600">{errorWord}</p>}
      </div>
      <div className="pgc-marco">
        <InformeMonitoreo sitio={sitio} resultado={resultado} definicion={definicion} />
      </div>
    </>
  );
}

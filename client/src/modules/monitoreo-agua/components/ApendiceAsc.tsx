import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { descargarCsv } from '@/utils/csv';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { aniosDe } from '../logic/monitoreo';
import { RESULTADOS_AGUA } from '../meta';
import { ApendiceX, COLUMNAS_APENDICE, filasApendice } from './informe/ApendiceX';
import { SelectorAnio } from './SelectorAnio';

/**
 * Reporte del afluente: Apéndice X de calidad de agua (ASC) de una camaronera en un año. Reúne los resultados del
 * afluente y del efluente de esa camaronera. Se imprime o se descarga para Excel.
 */
export function ApendiceAsc() {
  const { definicion, sitios, resultados, error, cargando } = useMonitoreo();
  const conAfluente = useMemo(
    () => (sitios ?? []).filter((s) => (resultados ?? []).some((r) => r.punto === 'afluente' && r.sitios.includes(s.id))),
    [sitios, resultados],
  );
  const [sitioElegido, setSitio] = useState<number | null>(null);
  const sitio = conAfluente.find((s) => s.id === sitioElegido) ?? conAfluente[0] ?? null;
  const delSitio = useMemo(() => (resultados ?? []).filter((r) => sitio && r.sitios.includes(sitio.id)), [resultados, sitio]);
  const anios = useMemo(() => aniosDe(delSitio), [delSitio]);
  const [anioElegido, setAnio] = useState<number | null | undefined>(undefined);
  const anio = anioElegido !== undefined && (anioElegido === null || anios.includes(anioElegido)) ? anioElegido : (anios[0] ?? null);
  const delAnio = delSitio.filter((r) => anio === null || r.fechaMuestreo.startsWith(String(anio)));

  if (error) return <Card className="py-10 text-center text-red-600">No se pudo cargar: {error}</Card>;
  if (cargando || !definicion) return <Card className="py-10 text-center text-slate-500">Cargando…</Card>;

  if (!sitio) {
    return (
      <Card className="flex flex-col items-center py-14 text-center">
        <FileSpreadsheet size={40} className="text-brand-500" />
        <p className="mt-3 text-lg font-semibold">Aún no hay resultados del afluente</p>
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
          El Apéndice X (calidad de agua ASC) se arma con los resultados del afluente y del efluente de cada camaronera. Regístrelos en{' '}
          <Link to={`${RESULTADOS_AGUA.path}/afluente`} className="font-semibold text-brand-500 hover:underline">
            Resultados · Afluente
          </Link>
          .
        </p>
      </Card>
    );
  }

  const titulo = sitio.nombre.toUpperCase();
  const descargar = () =>
    descargarCsv(
      `Apendice X-Calidad de Agua ${sitio.nombre}${anio ? ` ${anio}` : ''}-ASC.csv`,
      COLUMNAS_APENDICE,
      filasApendice(delAnio, definicion).map((f) => [
        f.fecha, f.analisis, f.ubicacion, f.metodo, f.muestreoTercero, f.analisisTercero, f.resultado, f.unidad,
      ]),
    );

  return (
    <>
      <Card
        compact
        className="mb-4 print:hidden"
        title="Apéndice X · Calidad de agua (ASC)"
        subtitle="Afluente y efluente de la camaronera, en orden de fecha"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={descargar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Download size={15} /> Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Printer size={15} /> Imprimir
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <select value={sitio.id} onChange={(e) => setSitio(Number(e.target.value))} aria-label="Camaronera"
            className="max-w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {conAfluente.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <SelectorAnio anios={anios} anio={anio} onCambiar={setAnio} />
        </div>
      </Card>
      <div className="pgc-marco">
        <ApendiceX titulo={titulo} resultados={delAnio} definicion={definicion} />
      </div>
    </>
  );
}

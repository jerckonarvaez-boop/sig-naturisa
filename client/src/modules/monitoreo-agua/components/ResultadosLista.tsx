import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, FileUp, ListPlus, Plus } from 'lucide-react';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fechaCorta } from '@/utils/fechas';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { aniosDe, incumplimientos, parametroDe, semestre } from '../logic/monitoreo';
import { RESULTADOS_AGUA, type PuntoMonitoreo } from '../meta';
import { completarDesdePdf, type Completado } from '../services/completarParametros';
import { urlPdf } from '../services/monitoreo.api';
import { SelectorAnio } from './SelectorAnio';
import { SelectorSemestre, type Periodo } from './SelectorSemestre';

/** Resultados de los laboratorios de un punto (afluente o efluente). Clic en una fila para abrirlo. */
export function ResultadosLista({ punto }: { punto: PuntoMonitoreo }) {
  const { definicion, sitios, resultados, error, cargando, recargar } = useMonitoreo(punto);
  const navigate = useNavigate();
  const anios = useMemo(() => aniosDe(resultados ?? []), [resultados]);
  const [anioElegido, setAnio] = useState<number | null | undefined>(undefined);
  const [periodo, setPeriodo] = useState<Periodo>(0);
  const anio = anioElegido !== undefined ? anioElegido : (anios[0] ?? null);
  const delAnio = (resultados ?? []).filter(
    (r) => (anio === null || r.fechaMuestreo.startsWith(String(anio))) && (!periodo || semestre(r.fechaMuestreo) === periodo),
  );
  const nombreSitio = (id: number) => sitios?.find((s) => s.id === id)?.nombre ?? `#${id}`;
  const rutaNuevo = `${RESULTADOS_AGUA.path}/${punto}/nuevo`;
  const archivo = useRef<HTMLInputElement>(null);
  const [avance, setAvance] = useState<{ hechos: number; total: number } | null>(null);
  const [revision, setRevision] = useState<{ completados: Completado[]; errores: string[] } | null>(null);
  const conPdf = (resultados ?? []).filter((r) => r.pdf);

  /** Lee otra vez el PDF de todos los resultados y agrega los parámetros que no se guardaron */
  async function completar() {
    setRevision(null);
    setAvance({ hechos: 0, total: conPdf.length });
    try {
      setRevision(await completarDesdePdf(conPdf, (hechos) => setAvance({ hechos, total: conPdf.length })));
      await recargar();
    } finally {
      setAvance(null);
    }
  }

  // El PDF elegido viaja al formulario nuevo, que lo lee y llena los datos
  const botonNuevo = (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to={rutaNuevo}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Plus size={16} /> Registrar a mano
      </Link>
      {conPdf.length > 0 && (
        <button
          type="button"
          onClick={completar}
          disabled={!!avance}
          title="Lee otra vez el PDF de cada resultado y agrega los parámetros que faltan (no cambia los valores ya registrados)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ListPlus size={16} /> {avance ? `Revisando ${avance.hechos}/${avance.total}…` : 'Completar parámetros desde los PDF'}
        </button>
      )}
      <button type="button" onClick={() => archivo.current?.click()} className={`${BOTON_PRIMARIO} inline-flex items-center gap-1.5 py-2`}>
        <FileUp size={16} /> Subir PDF del laboratorio
      </button>
      <input
        ref={archivo}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => {
          const pdf = e.target.files?.[0];
          if (pdf) navigate(rutaNuevo, { state: { pdf } });
        }}
      />
    </div>
  );

  if (error) return <Card className="py-10 text-center text-red-600">No se pudieron cargar los resultados: {error}</Card>;
  if (cargando || !definicion) return <Card className="py-10 text-center text-slate-500">Cargando…</Card>;

  if (!resultados?.length) {
    return (
      <Card className="flex flex-col items-center py-14 text-center">
        <FileText size={40} className="text-brand-500" />
        <p className="mt-3 text-lg font-semibold">Aún no hay resultados del {punto}</p>
        <p className="mt-1 mb-4 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Suba el PDF que envía el laboratorio: el código, las fechas, las camaroneras y los parámetros se llenan solos y usted
          solo revisa y guarda.
        </p>
        {botonNuevo}
      </Card>
    );
  }

  return (
    <Card
      compact
      title={`${delAnio.length} ${delAnio.length === 1 ? 'resultado' : 'resultados'}`}
      subtitle="Pulse una fila para abrirla"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SelectorSemestre periodo={periodo} onCambiar={setPeriodo} />
          <SelectorAnio anios={anios} anio={anio} onCambiar={setAnio} />
          {botonNuevo}
        </div>
      }
    >
      {revision && (
        <div role="status" className="mb-3 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:bg-sky-500/10 dark:text-sky-100">
          {revision.completados.length ? (
            <>
              <p className="font-semibold">
                {revision.completados.length === 1 ? 'Se completó 1 resultado' : `Se completaron ${revision.completados.length} resultados`} (ya salen
                en sus informes):
              </p>
              <ul className="mt-1 list-disc pl-5">
                {revision.completados.map(({ resultado: r, agregados }) => (
                  <li key={r.id}>
                    <b>{r.codigo || 'Sin código'}</b>: {agregados.map((a) => `${parametroDe(definicion, a.clave)?.nombre ?? a.clave} ${a.valor}`).join(' · ')}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-semibold">Todos los resultados ya tienen los parámetros de su PDF.</p>
          )}
          {revision.errores.length > 0 && <p className="mt-1 text-red-700 dark:text-red-300">No se pudieron revisar: {revision.errores.join(' · ')}</p>}
        </div>
      )}
      <Tabla anchoMinimo="min-w-[900px]">
        <thead>
          <tr className={FILA_ENCABEZADO}>
            <th className="px-3 py-2 font-semibold">Muestreo</th>
            <th className="px-3 py-2 font-semibold">Informe del laboratorio</th>
            <th className="px-3 py-2 font-semibold">Punto de muestreo</th>
            <th className="px-3 py-2 font-semibold">Camaroneras / instalaciones</th>
            <th className="px-3 py-2 font-semibold">{punto === 'efluente' ? 'Límites (AM 097a)' : 'Parámetros'}</th>
            <th className="px-3 py-2 font-semibold">PDF</th>
          </tr>
        </thead>
        <tbody>
          {!delAnio.length && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                No hay resultados del {periodo === 1 ? 'primer semestre' : 'segundo semestre'}
                {anio === null ? '' : ` de ${anio}`}.
              </td>
            </tr>
          )}
          {delAnio.map((r) => {
            const abrir = () => navigate(`${RESULTADOS_AGUA.path}/${punto}/${r.id}`);
            const fuera = incumplimientos(r, definicion);
            return (
              <tr
                key={r.id}
                tabIndex={0}
                onClick={abrir}
                onKeyDown={(e) => e.key === 'Enter' && abrir()}
                className="cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <td className="px-3 py-2 whitespace-nowrap">{fechaCorta(r.fechaMuestreo)}</td>
                <td className="px-3 py-2">
                  <span className="font-medium whitespace-nowrap">{r.codigo || '—'}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{r.laboratorio}</span>
                </td>
                <td className="px-3 py-2">{r.locacion || '—'}</td>
                <td className="px-3 py-2">
                  <span className="block max-w-72">{r.sitios.map(nombreSitio).join(' · ')}</span>
                </td>
                <td className="px-3 py-2">
                  {punto === 'efluente' ? (
                    <>
                      {fuera.length ? (
                        <span title={fuera.map((f) => parametroDe(definicion, f.clave)?.nombre).join(', ')}>
                          <StatusBadge tone="danger" label={`Supera ${fuera.length}`} />
                        </span>
                      ) : (
                        <StatusBadge tone="success" label="Cumple" />
                      )}
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{r.valores.filter((v) => v.valor).length} parámetros</span>
                    </>
                  ) : (
                    <span className="tabular-nums">{r.valores.filter((v) => v.valor).length}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {r.pdf ? (
                    <a
                      href={urlPdf(r.id)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline"
                    >
                      <FileText size={14} /> Ver
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Tabla>
    </Card>
  );
}

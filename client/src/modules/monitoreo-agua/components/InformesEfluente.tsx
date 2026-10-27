import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileArchive, FileText, Settings } from 'lucide-react';
import { descargar } from '@/services/documentos/correo';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fechaCorta } from '@/utils/fechas';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { aniosDe, incumplimientos, nombreArchivoInforme, semestre } from '../logic/monitoreo';
import { FICHAS_TECNICAS, REPORTES_AGUA, RESULTADOS_AGUA } from '../meta';
import { informesAZip } from '../services/informeWord';
import { SelectorAnio } from './SelectorAnio';
import { SelectorSemestre, type Periodo } from './SelectorSemestre';

/** "2026-2" (año y semestre) para agrupar los informes */
const grupoDe = (iso: string) => `${iso.slice(0, 4)}-${semestre(iso)}`;
const claveDe = (i: { resultado: { id: number }; sitio: { id: number } }) => `${i.resultado.id}-${i.sitio.id}`;
const nombreGrupo = (g: string) => `${g.endsWith('-1') ? 'Primer' : 'Segundo'} semestre ${g.slice(0, 4)}`;

/**
 * Informes de Monitoreo PGC-025 del efluente: uno por cada camaronera de cada resultado del laboratorio.
 * Se generan solos con la ficha técnica de la camaronera y los datos del resultado.
 */
export function InformesEfluente() {
  const { definicion, sitios, resultados, error, cargando } = useMonitoreo('efluente');
  const anios = useMemo(() => aniosDe(resultados ?? []), [resultados]);
  const [anioElegido, setAnio] = useState<number | null | undefined>(undefined);
  const [periodo, setPeriodo] = useState<Periodo>(0);
  /** Informes marcados para descargar (resultado-camaronera) */
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [avance, setAvance] = useState<{ hechos: number; total: number } | null>(null);
  const [errorZip, setErrorZip] = useState<string | null>(null);
  const anio = anioElegido !== undefined ? anioElegido : (anios[0] ?? null);

  const informes = useMemo(() => {
    if (!sitios || !resultados) return [];
    return resultados
      .filter((r) => (anio === null || r.fechaMuestreo.startsWith(String(anio))) && (!periodo || semestre(r.fechaMuestreo) === periodo))
      .flatMap((r) => r.sitios.map((id) => ({ resultado: r, sitio: sitios.find((s) => s.id === id)! })))
      .filter((i) => i.sitio)
      .map((i) => ({ ...i, grupo: grupoDe(i.resultado.fechaMuestreo) }))
      // El semestre más reciente primero y, dentro de cada uno, por número de camaronera
      .sort(
        (a, b) =>
          b.grupo.localeCompare(a.grupo) ||
          a.sitio.numero - b.sitio.numero ||
          b.resultado.fechaMuestreo.localeCompare(a.resultado.fechaMuestreo),
      );
  }, [sitios, resultados, anio, periodo]);
  const porGrupo = (g: string) => informes.filter((i) => i.grupo === g).length;
  // Solo cuentan los marcados que se ven con el año y semestre elegidos
  const elegidos = informes.filter((i) => marcados.has(claveDe(i)));
  const todosMarcados = informes.length > 0 && elegidos.length === informes.length;
  const marcar = (claves: string[], si: boolean) =>
    setMarcados((m) => {
      const nuevo = new Set(m);
      claves.forEach((c) => (si ? nuevo.add(c) : nuevo.delete(c)));
      return nuevo;
    });

  // Instalaciones activas sin resultado del efluente en el periodo elegido
  const pendientes = useMemo(
    () => (anio === null ? [] : (sitios ?? []).filter((s) => s.activo && !informes.some((i) => i.sitio.id === s.id))),
    [sitios, informes, anio],
  );

  /** Los marcados o, si no hay, todos los que se ven: un .zip con un Word por informe */
  async function descargarZip() {
    if (!definicion) return;
    const lista = elegidos.length ? elegidos : informes;
    setErrorZip(null);
    setAvance({ hechos: 0, total: lista.length });
    try {
      const zip = await informesAZip(lista, definicion, nombreArchivoInforme, (hechos) => setAvance({ hechos, total: lista.length }));
      const periodoTexto = anio === null ? 'todos' : `${anio}${periodo ? `-S${periodo}` : ''}`;
      descargar(zip, `Informes PGC-025 efluente ${periodoTexto}.zip`);
    } catch (e) {
      setErrorZip(`No se pudieron generar los Word: ${(e as Error).message}`);
    } finally {
      setAvance(null);
    }
  }

  if (error) return <Card className="py-10 text-center text-red-600">No se pudieron cargar los informes: {error}</Card>;
  if (cargando || !definicion) return <Card className="py-10 text-center text-slate-500">Cargando…</Card>;

  const enlaceFichas = (
    <Link to={FICHAS_TECNICAS.path} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline">
      <Settings size={14} /> Fichas técnicas
    </Link>
  );

  if (!resultados?.length) {
    return (
      <Card className="flex flex-col items-center py-14 text-center">
        <FileText size={40} className="text-brand-500" />
        <p className="mt-3 text-lg font-semibold">Aún no hay informes del efluente</p>
        <p className="mt-1 mb-4 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Los informes PGC-025 se generan solos al registrar los resultados del laboratorio en{' '}
          <Link to={`${RESULTADOS_AGUA.path}/efluente`} className="font-semibold text-brand-500 hover:underline">
            Resultados · Efluente
          </Link>
          .
        </p>
        {enlaceFichas}
      </Card>
    );
  }

  return (
    <Card
      compact
      title={`${informes.length} ${informes.length === 1 ? 'informe' : 'informes'} PGC-025`}
      subtitle="Informe de Monitoreo del Análisis de Agua del Efluente · uno por camaronera"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {enlaceFichas}
          <button
            type="button"
            onClick={descargarZip}
            disabled={!!avance || !informes.length}
            title="Descarga un .zip con un Word por informe"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <FileArchive size={15} />
            {avance
              ? `Generando ${avance.hechos}/${avance.total}…`
              : elegidos.length
                ? `Descargar ${elegidos.length} en Word`
                : `Descargar todos en Word (${informes.length})`}
          </button>
          <SelectorSemestre periodo={periodo} onCambiar={setPeriodo} />
          <SelectorAnio anios={anios} anio={anio} onCambiar={setAnio} />
        </div>
      }
    >
      <Tabla anchoMinimo="min-w-[760px]">
        <thead>
          <tr className={FILA_ENCABEZADO}>
            <th className="w-8 py-2 pl-3">
              <input
                type="checkbox"
                checked={todosMarcados}
                ref={(el) => {
                  if (el) el.indeterminate = elegidos.length > 0 && !todosMarcados;
                }}
                onChange={(e) => marcar(informes.map(claveDe), e.target.checked)}
                aria-label="Seleccionar todos los informes"
                className="size-4 accent-brand-500"
              />
            </th>
            <th className="w-12 px-3 py-2 font-semibold">N.º</th>
            <th className="px-3 py-2 font-semibold">Camaronera / instalación</th>
            <th className="px-3 py-2 font-semibold">Muestreo</th>
            <th className="px-3 py-2 font-semibold">Informe del laboratorio</th>
            <th className="px-3 py-2 font-semibold">Límites</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {informes.map(({ resultado: r, sitio: s, grupo }, i) => {
            const fuera = incumplimientos(r, definicion);
            return (
              <Fragment key={`${r.id}-${s.id}`}>
                {grupo !== informes[i - 1]?.grupo && (
                  <tr className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                    <td colSpan={7} className="px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-300">
                      {nombreGrupo(grupo)} · {porGrupo(grupo)} {porGrupo(grupo) === 1 ? 'informe' : 'informes'}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pl-3">
                    <input
                      type="checkbox"
                      checked={marcados.has(claveDe({ resultado: r, sitio: s }))}
                      onChange={(e) => marcar([claveDe({ resultado: r, sitio: s })], e.target.checked)}
                      aria-label={`Seleccionar el informe de ${s.nombre}`}
                      className="size-4 accent-brand-500"
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{s.numero}</td>
                  <td className="px-3 py-2 font-medium">{s.nombre}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fechaCorta(r.fechaMuestreo)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link to={`${RESULTADOS_AGUA.path}/efluente/${r.id}`} className="hover:text-brand-500 hover:underline">
                      {r.codigo || 'Sin código'}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {fuera.length ? <StatusBadge tone="danger" label={`Supera ${fuera.length}`} /> : <StatusBadge tone="success" label="Cumple" />}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to={`${REPORTES_AGUA.path}/efluente/${r.id}/${s.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold whitespace-nowrap hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <FileText size={13} /> Ver informe
                    </Link>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </Tabla>
      {errorZip && <p className="mt-3 text-sm font-semibold text-red-600">{errorZip}</p>}
      {pendientes.length > 0 && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
          <b>Sin resultado del efluente en {periodo ? `el ${periodo === 1 ? 'primer' : 'segundo'} semestre de ` : ''}{anio}:</b>{' '}
          {pendientes.map((s) => `${s.numero}. ${s.nombre}`).join(' · ')}
        </p>
      )}
    </Card>
  );
}

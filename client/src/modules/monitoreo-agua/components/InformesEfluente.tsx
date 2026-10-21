import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Settings } from 'lucide-react';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fechaCorta } from '@/utils/fechas';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { aniosDe, incumplimientos, semestre } from '../logic/monitoreo';
import { FICHAS_TECNICAS, REPORTES_AGUA, RESULTADOS_AGUA } from '../meta';
import { SelectorAnio } from './SelectorAnio';
import { SelectorSemestre, type Periodo } from './SelectorSemestre';

/**
 * Informes de Monitoreo PGC-025 del efluente: uno por cada camaronera de cada resultado del laboratorio.
 * Se generan solos con la ficha técnica de la camaronera y los datos del resultado.
 */
export function InformesEfluente() {
  const { definicion, sitios, resultados, error, cargando } = useMonitoreo('efluente');
  const anios = useMemo(() => aniosDe(resultados ?? []), [resultados]);
  const [anioElegido, setAnio] = useState<number | null | undefined>(undefined);
  const [periodo, setPeriodo] = useState<Periodo>(0);
  const anio = anioElegido !== undefined ? anioElegido : (anios[0] ?? null);

  const informes = useMemo(() => {
    if (!sitios || !resultados) return [];
    return resultados
      .filter((r) => (anio === null || r.fechaMuestreo.startsWith(String(anio))) && (!periodo || semestre(r.fechaMuestreo) === periodo))
      .flatMap((r) => r.sitios.map((id) => ({ resultado: r, sitio: sitios.find((s) => s.id === id)! })))
      .filter((i) => i.sitio)
      .sort((a, b) => a.sitio.numero - b.sitio.numero || b.resultado.fechaMuestreo.localeCompare(a.resultado.fechaMuestreo));
  }, [sitios, resultados, anio, periodo]);

  // Instalaciones activas sin resultado del efluente en el periodo elegido
  const pendientes = useMemo(
    () => (anio === null ? [] : (sitios ?? []).filter((s) => s.activo && !informes.some((i) => i.sitio.id === s.id))),
    [sitios, informes, anio],
  );

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
          <SelectorSemestre periodo={periodo} onCambiar={setPeriodo} />
          <SelectorAnio anios={anios} anio={anio} onCambiar={setAnio} />
        </div>
      }
    >
      <Tabla anchoMinimo="min-w-[760px]">
        <thead>
          <tr className={FILA_ENCABEZADO}>
            <th className="w-12 px-3 py-2 font-semibold">N.º</th>
            <th className="px-3 py-2 font-semibold">Camaronera / instalación</th>
            <th className="px-3 py-2 font-semibold">Muestreo</th>
            <th className="px-3 py-2 font-semibold">Informe del laboratorio</th>
            <th className="px-3 py-2 font-semibold">Límites</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {informes.map(({ resultado: r, sitio: s }) => {
            const fuera = incumplimientos(r, definicion);
            return (
              <tr key={`${r.id}-${s.id}`} className="border-t border-slate-100 dark:border-slate-800">
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
            );
          })}
        </tbody>
      </Tabla>
      {pendientes.length > 0 && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
          <b>Sin resultado del efluente en {periodo ? `el ${periodo === 1 ? 'primer' : 'segundo'} semestre de ` : ''}{anio}:</b>{' '}
          {pendientes.map((s) => `${s.numero}. ${s.nombre}`).join(' · ')}
        </p>
      )}
    </Card>
  );
}

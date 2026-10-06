import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { fechaCorta } from '@/features/eventos/fechas';
import { meta } from '../meta';
import { listarRevisiones } from './api';
import { agruparPorSeccion, contar, nombreCorto } from './calculo';
import { BarraCumplimiento } from './components/Cumplimiento';
import type { Revision } from './types';

/** Historial de revisiones del check list, con su cumplimiento por área. */
export function ChecklistListaPage() {
  const [revisiones, setRevisiones] = useState<Revision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listarRevisiones().then(setRevisiones).catch((e: Error) => setError(e.message));
  }, []);

  // Las columnas de áreas salen de las propias revisiones (en orden del formato)
  const secciones = useMemo(
    () => agruparPorSeccion(revisiones?.[0]?.respuestas ?? []).map((g) => g.seccion),
    [revisiones],
  );

  const botonNueva = (
    <Link
      to="nueva"
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-sky-600 dark:hover:bg-sky-500"
    >
      <Plus size={16} /> Nueva revisión
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Check list Buenas Prácticas"
        subtitle="Revisión de áreas previa a la inspección SCI"
        breadcrumb={{ label: meta.label, to: meta.path }}
        actions={botonNueva}
      />

      {error ? (
        <Card className="py-10 text-center text-red-600">No se pudieron cargar las revisiones: {error}</Card>
      ) : !revisiones ? (
        <Card className="py-10 text-center text-slate-500">Cargando…</Card>
      ) : !revisiones.length ? (
        <Card className="flex flex-col items-center py-14 text-center">
          <ClipboardList size={40} className="text-brand-500" />
          <p className="mt-3 text-lg font-semibold">Aún no hay revisiones registradas</p>
          <p className="mt-1 mb-4 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Registre la revisión de una sucursal con el formato de 43 requisitos en 5 áreas.
          </p>
          {botonNueva}
        </Card>
      ) : (
        <Card compact>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[900px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-left text-brand-900 dark:bg-slate-800/60 dark:text-slate-200">
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-3 py-2 font-semibold">Sucursal</th>
                  <th className="px-3 py-2 font-semibold">Responsable</th>
                  <th className="w-40 px-3 py-2 font-semibold">General</th>
                  {secciones.map((s) => (
                    <th key={s} className="px-2 py-2 text-xs font-semibold" title={s}>
                      {nombreCorto(s)}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold" title="Requisitos que no cumplen">
                    NO
                  </th>
                  <th className="px-3 py-2 text-right font-semibold" title="Requisitos sin responder">
                    Pend.
                  </th>
                </tr>
              </thead>
              <tbody>
                {revisiones.map((r) => {
                  const general = contar(r.respuestas.map((x) => x.respuesta));
                  const porSeccion = agruparPorSeccion(r.respuestas);
                  return (
                    <tr
                      key={r.id}
                      tabIndex={0}
                      onClick={() => navigate(String(r.id))}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(String(r.id))}
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">{fechaCorta(r.fecha)}</td>
                      <td className="px-3 py-2 font-medium">{r.sucursal}</td>
                      <td className="px-3 py-2">{r.responsable || '—'}</td>
                      <td className="px-3 py-2">
                        <BarraCumplimiento conteo={general} />
                      </td>
                      {secciones.map((s) => {
                        const grupo = porSeccion.find((g) => g.seccion === s);
                        return (
                          <td key={s} className="px-2 py-2">
                            {grupo ? <BarraCumplimiento conteo={contar(grupo.items.map((x) => x.respuesta))} compacta /> : '—'}
                          </td>
                        );
                      })}
                      <td className={`px-3 py-2 text-right tabular-nums ${general.no ? 'font-semibold text-red-600 dark:text-red-400' : ''}`}>
                        {general.no}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500 tabular-nums">{general.sinResponder || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

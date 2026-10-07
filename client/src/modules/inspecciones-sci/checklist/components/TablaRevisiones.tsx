import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { fechaCorta } from '@/utils/fechas';
import { agruparPorSeccion, contar, nombreCorto } from '../logic/calculo';
import type { Revision } from '../types';
import { BarraCumplimiento } from './Cumplimiento';

/** Tabla del historial: cumplimiento general y por área de cada revisión. Clic en una fila para abrirla. */
export function TablaRevisiones({ revisiones }: { revisiones: Revision[] }) {
  const navigate = useNavigate();

  // Las columnas de áreas salen de las propias revisiones (en orden del formato)
  const secciones = useMemo(
    () => agruparPorSeccion(revisiones[0]?.respuestas ?? []).map((g) => g.seccion),
    [revisiones],
  );

  return (
    <Tabla anchoMinimo="min-w-[900px]">
      <thead>
        <tr className={FILA_ENCABEZADO}>
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
    </Tabla>
  );
}

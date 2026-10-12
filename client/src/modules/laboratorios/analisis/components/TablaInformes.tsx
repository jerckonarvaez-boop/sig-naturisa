import { useNavigate } from 'react-router-dom';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { fechaCorta } from '@/utils/fechas';
import { nombreTipo } from '../logic/laboratorio';
import type { InformeResumen, SeccionLab } from '../types';

/** Historial de informes de una sección. Clic en una fila para abrirlo. */
export function TablaInformes({ seccion, informes }: { seccion: SeccionLab; informes: InformeResumen[] }) {
  const navigate = useNavigate();
  return (
    <Tabla anchoMinimo="min-w-[860px]">
      <thead>
        <tr className={FILA_ENCABEZADO}>
          <th className="px-3 py-2 font-semibold">Código</th>
          <th className="px-3 py-2 font-semibold">Emisión</th>
          <th className="px-3 py-2 font-semibold">Identificación</th>
          <th className="px-3 py-2 font-semibold">Tipo</th>
          <th className="px-3 py-2 font-semibold">{seccion.etiquetaMuestra === 'Piscina' ? 'Piscinas' : 'Muestras'}</th>
          <th className="px-3 py-2 font-semibold">Técnico</th>
        </tr>
      </thead>
      <tbody>
        {informes.map((i) => (
          <tr
            key={i.id}
            tabIndex={0}
            onClick={() => navigate(String(i.id))}
            onKeyDown={(e) => e.key === 'Enter' && navigate(String(i.id))}
            className="cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
          >
            <td className="px-3 py-2 font-medium whitespace-nowrap">{i.codigo}</td>
            <td className="px-3 py-2 whitespace-nowrap">{fechaCorta(i.fechaEmision)}</td>
            <td className="px-3 py-2">
              {i.sucursal}
              {i.matriz && <span className="block text-xs text-slate-500 dark:text-slate-400">{i.matriz}</span>}
            </td>
            <td className="px-3 py-2">{nombreTipo(seccion, i.tipo)}</td>
            <td className="px-3 py-2">
              <span className="font-semibold tabular-nums">{i.muestras.length}</span>
              <span className="block max-w-56 truncate text-xs text-slate-500 dark:text-slate-400" title={i.muestras.join(', ')}>
                {i.muestras.join(', ')}
              </span>
            </td>
            <td className="px-3 py-2">{i.tecnico || '—'}</td>
          </tr>
        ))}
      </tbody>
    </Tabla>
  );
}

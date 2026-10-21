import { useState } from 'react';
import { Plus } from 'lucide-react';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FichaModal } from '../components/FichaModal';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { FICHAS_TECNICAS, meta } from '../meta';
import { actualizarSitio, crearSitio, eliminarSitio } from '../services/monitoreo.api';
import type { Sitio, SitioDatos } from '../types';

/** Camaroneras e instalaciones con la ficha técnica que sale en el informe PGC-025. */
export function FichasPage() {
  const { sitios, error, recargar } = useMonitoreo('efluente');
  /** null = cerrado · 'nueva' = crear · Sitio = editar */
  const [editando, setEditando] = useState<Sitio | 'nueva' | null>(null);

  const guardar = async (datos: SitioDatos, id?: number) => {
    if (id) await actualizarSitio(id, datos);
    else await crearSitio(datos);
    await recargar();
  };
  const eliminar = async (id: number) => {
    await eliminarSitio(id);
    await recargar();
  };

  return (
    <>
      <PageHeader
        title={FICHAS_TECNICAS.label}
        subtitle={FICHAS_TECNICAS.description}
        breadcrumb={{ label: meta.label, to: meta.path }}
        actions={
          <button type="button" onClick={() => setEditando('nueva')} className={`${BOTON_PRIMARIO} inline-flex items-center gap-1.5 py-2`}>
            <Plus size={16} /> Nueva
          </button>
        }
      />
      {error ? (
        <Card className="py-10 text-center text-red-600">No se pudieron cargar: {error}</Card>
      ) : !sitios ? (
        <Card className="py-10 text-center text-slate-500">Cargando…</Card>
      ) : (
        <Card compact title={`${sitios.length} camaroneras e instalaciones`} subtitle="Pulse una fila para editar su ficha técnica">
          <Tabla anchoMinimo="min-w-[720px]">
            <thead>
              <tr className={FILA_ENCABEZADO}>
                <th className="w-12 px-3 py-2 font-semibold">N.º</th>
                <th className="px-3 py-2 font-semibold">Nombre en el informe</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">RUC</th>
                <th className="px-3 py-2 font-semibold">Coordenadas</th>
                <th className="px-3 py-2 font-semibold">Resultados</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sitios.map((s) => (
                <tr
                  key={s.id}
                  tabIndex={0}
                  onClick={() => setEditando(s)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditando(s)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="px-3 py-2 tabular-nums">{s.numero}</td>
                  <td className="px-3 py-2 font-medium">{s.nombre}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{s.tipo === 'larvas' ? 'Lab. de larvas' : 'Camaronera'}</td>
                  <td className="px-3 py-2 tabular-nums">{s.ruc || '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{s.coordenadas.length}</td>
                  <td className="px-3 py-2 tabular-nums">{s.resultados}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={s.activo ? 'success' : 'neutral'} label={s.activo ? 'Activa' : 'Inactiva'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        </Card>
      )}

      {editando && (
        <FichaModal
          sitio={editando === 'nueva' ? undefined : editando}
          siguienteNumero={Math.max(0, ...(sitios ?? []).map((s) => s.numero)) + 1}
          onGuardar={guardar}
          onEliminar={eliminar}
          onCerrar={() => setEditando(null)}
        />
      )}
    </>
  );
}

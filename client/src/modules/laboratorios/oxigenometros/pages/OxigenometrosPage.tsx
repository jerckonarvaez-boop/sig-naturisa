import { useState } from 'react';
import { Gauge, Plus } from 'lucide-react';
import { BarList } from '@/components/charts/BarList';
import { TooltipLayer } from '@/components/charts/Tooltip';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { dinero, dineroCorto } from '@/utils/numeros';
import { meta } from '../../meta';
import { KpisAhorro } from '../components/KpisAhorro';
import { ReparacionModal } from '../components/ReparacionModal';
import { TablaReparaciones } from '../components/TablaReparaciones';
import { useReparaciones } from '../hooks/useReparaciones';
import type { Reparacion } from '../types';

const dinero2 = (v: number) => dinero(v, 2);

/** Oxigenómetros: reparaciones de partes y ahorro frente a comprar partes nuevas. */
export function OxigenometrosPage() {
  const r = useReparaciones();
  // undefined = cerrado; null = nueva reparación
  const [editando, setEditando] = useState<Reparacion | null | undefined>(undefined);

  const botonNueva = (
    <button type="button" onClick={() => setEditando(null)} className={`${BOTON_PRIMARIO} inline-flex items-center gap-1.5 py-2`}>
      <Plus size={16} /> Registrar reparación
    </button>
  );

  const acciones = (
    <div className="flex flex-wrap items-center gap-2">
      {r.anios.length > 0 && (
        <select
          value={r.anio ?? 'todos'}
          onChange={(e) => r.setAnio(e.target.value === 'todos' ? null : Number(e.target.value))}
          aria-label="Año"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          {r.anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
          <option value="todos">Todos los años</option>
        </select>
      )}
      {botonNueva}
    </div>
  );

  const periodo = r.anio == null ? 'todos los años' : String(r.anio);

  return (
    <>
      <PageHeader
        title="Oxigenómetros"
        subtitle="Reparación de partes y ahorro frente a comprar partes nuevas"
        breadcrumb={{ label: meta.label, to: meta.path }}
        actions={acciones}
      />

      {r.error ? (
        <Card className="py-12 text-center text-red-600">No se pudieron cargar las reparaciones: {r.error}</Card>
      ) : r.cargando ? (
        <Card className="py-12 text-center text-slate-500">Cargando reparaciones…</Card>
      ) : !r.hayDatos ? (
        <Card className="flex flex-col items-center py-14 text-center">
          <Gauge size={40} className="text-brand-500" />
          <p className="mt-3 text-lg font-semibold">Aún no hay reparaciones registradas</p>
          <p className="mt-1 mb-4 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Registre cada parte reparada con su costo y el precio de comprarla nueva: el ahorro se calcula solo.
          </p>
          {botonNueva}
        </Card>
      ) : (
        <TooltipLayer>
          <KpisAhorro resumen={r.resumen} />

          <div className="mb-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
            <Card compact title={`Ahorro por mes · ${periodo}`}>
              <BarList items={r.porMes} formato={dineroCorto} formatoLargo={dinero2} />
            </Card>
            <Card compact title="Ahorro por tipo de parte">
              <BarList items={r.porParte} formato={dineroCorto} formatoLargo={dinero2} vacio="Sin partes reparadas en este periodo" limite={10} />
            </Card>
          </div>

          <Card compact title={`Reparaciones · ${periodo}`} subtitle="Pulse una fila para editarla">
            {r.delPeriodo.length ? (
              <TablaReparaciones reparaciones={r.delPeriodo} onEditar={setEditando} />
            ) : (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No hay reparaciones en este periodo.</p>
            )}
          </Card>
        </TooltipLayer>
      )}

      {editando !== undefined && (
        <ReparacionModal
          reparacion={editando ?? undefined}
          sugerencias={r.sugerencias}
          onGuardar={r.guardar}
          onEliminar={r.eliminar}
          onCerrar={() => setEditando(undefined)}
        />
      )}
    </>
  );
}

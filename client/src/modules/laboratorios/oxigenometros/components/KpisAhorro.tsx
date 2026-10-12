import type { ReactNode } from 'react';
import { PiggyBank } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { dinero, miles } from '@/utils/numeros';
import type { ResumenAhorro } from '../logic/ahorro';

/** Indicadores principales: partes reparadas, ahorro total y ahorro promedio por parte. */
export function KpisAhorro({ resumen }: { resumen: ResumenAhorro }) {
  const { partesReparadas, ahorro, promedioPorParte, enReparacion, noReparables } = resumen;
  const pendientes = [
    enReparacion ? `${miles(enReparacion)} en reparación` : '',
    noReparables ? `${miles(noReparables)} no reparables` : '',
  ].filter(Boolean);

  return (
    <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
      <Indicador etiqueta="Partes reparadas" valor={miles(partesReparadas)} detalle={pendientes.join(' · ') || 'Sin pendientes'} />
      <Indicador
        etiqueta="Ahorro"
        valor={dinero(ahorro)}
        destacado
        detalle={
          <span className="inline-flex items-center gap-1">
            <PiggyBank size={13} /> Lo que habría costado comprarlas nuevas
          </span>
        }
      />
      <Indicador etiqueta="Ahorro promedio por parte" valor={dinero(promedioPorParte)} detalle="Precio de la última compra" />
    </div>
  );
}

function Indicador({ etiqueta, valor, detalle, destacado }: { etiqueta: string; valor: string; detalle: ReactNode; destacado?: boolean }) {
  return (
    <Card compact className={destacado ? 'ring-2 ring-emerald-500/40' : ''}>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{etiqueta}</p>
      <p className="mt-1 text-2xl leading-tight font-semibold tracking-tight tabular-nums md:text-3xl">{valor}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detalle}</p>
    </Card>
  );
}

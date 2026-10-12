import type { ReactNode } from 'react';
import { AlertTriangle, PiggyBank } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { dinero, miles, porcentaje } from '@/utils/numeros';
import type { ResumenAhorro } from '../logic/ahorro';

/** Indicadores principales: partes reparadas, ahorro y la comparación reparar vs. comprar nuevo. */
export function KpisAhorro({ resumen }: { resumen: ResumenAhorro }) {
  const { partesReparadas, ahorro, costoNuevo, costoReparacion, enReparacion, noReparables } = resumen;
  const pendientes = [
    enReparacion ? `${miles(enReparacion)} en reparación` : '',
    noReparables ? `${miles(noReparables)} no reparables` : '',
  ].filter(Boolean);

  return (
    <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
      <Indicador etiqueta="Partes reparadas" valor={miles(partesReparadas)} detalle={pendientes.join(' · ') || 'Sin pendientes'} />
      <Indicador
        etiqueta="Ahorro"
        valor={dinero(ahorro)}
        destacado
        detalle={
          ahorro < 0 ? (
            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle size={13} /> Reparar costó más que comprar nuevo
            </span>
          ) : costoNuevo > 0 ? (
            <span className="inline-flex items-center gap-1">
              <PiggyBank size={13} /> {porcentaje(resumen.porcentaje)} menos que comprar nuevo
            </span>
          ) : (
            'Aún sin reparaciones terminadas'
          )
        }
      />
      <Indicador etiqueta="Comprar nuevo habría costado" valor={dinero(costoNuevo)} detalle="Precio de las partes nuevas" />
      <Indicador etiqueta="Costo de reparar" valor={dinero(costoReparacion)} detalle="Repuestos y mano de obra" />
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

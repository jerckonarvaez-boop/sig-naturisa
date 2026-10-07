import { Card } from '@/components/ui/Card';
import { BarList } from '@/components/charts/BarList';
import { BudgetBars } from '@/components/charts/BudgetBars';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { dinero, dineroCorto, porcentaje } from '@/utils/numeros';
import { useTablero } from '../hooks/useTablero';
import type { PresupuestoData } from '../types';
import { BarraFiltros } from './BarraFiltros';
import { DetalleGastos } from './DetalleGastos';
import { EstadoDatos } from './EstadoDatos';
import { KpiPresupuesto } from './KpiPresupuesto';

const dinero2 = (v: number) => dinero(v, 2);

/** Tablero del presupuesto: filtros, indicador principal, gráficos y detalle de gastos. */
export function Tablero({ data }: { data: PresupuestoData }) {
  const t = useTablero(data);
  const { filtros } = t;

  return (
    <>
      <EstadoDatos importacion={data.importacion} />
      <BarraFiltros filtros={filtros} areas={t.areas} anios={t.anios} onArea={t.cambiarArea} onAnio={t.cambiarAnio} onQuitar={t.quitarFiltro} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
        <KpiPresupuesto {...t.kpi} />

        {t.vistaGeneral ? (
          <Card compact title="Gasto por área">
            <ColumnChart
              items={t.porArea}
              alto={300}
              formato={dineroCorto}
              formatoLargo={dinero2}
              onSelect={t.cambiarArea}
              subtexto={(i) => (i.presupuesto ? `${porcentaje(i.valor / i.presupuesto)} de ${dineroCorto(i.presupuesto)}` : 'sin presupuesto')}
              detalleTip={(i) => (i.presupuesto ? `Presupuesto ${dinero(i.presupuesto)}` : 'Sin presupuesto')}
            />
          </Card>
        ) : (
          <Card compact title="Ítems con mayor gasto">
            <BarList
              items={t.porItem}
              formato={dineroCorto}
              formatoLargo={dinero2}
              seleccion={filtros.item}
              onSelect={(k) => t.alternar('item', k)}
            />
          </Card>
        )}

        <Card compact title="Gasto por mes" className="md:col-span-2 xl:col-span-1">
          <BarList
            items={t.porMes}
            formato={dineroCorto}
            formatoLargo={dinero2}
            seleccion={filtros.mes != null ? String(filtros.mes) : null}
            onSelect={(k) => t.alternar('mes', Number(k))}
          />
        </Card>

        <Card compact title="Presupuesto vs. gasto por sub-área" className="md:col-span-2">
          <BudgetBars
            items={t.porSubarea}
            formato={dineroCorto}
            formatoLargo={dinero2}
            porcentaje={porcentaje}
            seleccion={filtros.subarea}
            onSelect={(k) => t.alternar('subarea', k)}
          />
        </Card>

        <Card compact title="Gasto por sucursal" className="md:col-span-2 xl:col-span-1">
          <BarList
            items={t.porSucursal}
            limite={12}
            formato={dineroCorto}
            formatoLargo={dinero2}
            seleccion={filtros.sucursal}
            onSelect={(k) => t.alternar('sucursal', k)}
          />
        </Card>

        <div className="md:col-span-2 xl:col-span-3">
          <DetalleGastos registros={t.detalle} busqueda={filtros.busqueda} onBuscar={t.buscarTexto} />
        </div>
      </div>
    </>
  );
}

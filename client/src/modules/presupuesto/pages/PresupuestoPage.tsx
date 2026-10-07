import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BarList } from '@/components/charts/BarList';
import { BudgetBars } from '@/components/charts/BudgetBars';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { TooltipLayer } from '@/components/charts/Tooltip';
import { BarraFiltros } from '../components/BarraFiltros';
import { DetalleGastos } from '../components/DetalleGastos';
import { ImportarExcel } from '../components/ImportarExcel';
import { KpiPresupuesto } from '../components/KpiPresupuesto';
import { dinero, dineroCorto, MESES_LARGO, porcentaje } from '../formato';
import {
  agrupar,
  AREA_GENERAL,
  aniosDisponibles,
  areasDisponibles,
  buscar,
  filtrar,
  prepararRegistros,
  presupuestoVigente,
  proyeccionCierre,
  totalGasto,
} from '../logic/logica';
import { meta } from '../meta';
import type { FiltroCruzado, Filtros, Importacion, PresupuestoData } from '../types';
import { usePresupuesto } from '../hooks/usePresupuesto';

const FILTROS_INICIALES: Filtros = {
  area: AREA_GENERAL,
  anio: null,
  sucursal: null,
  item: null,
  subarea: null,
  mes: null,
  busqueda: '',
};

const dinero2 = (v: number) => dinero(v, 2);
/** El área solo se muestra como subtítulo si no repite el nombre de la sub-área */
const otraArea = (area: string | undefined, subarea: string) => (area && area !== subarea ? area : undefined);

export function PresupuestoPage() {
  const { data, cargando, error, recargar } = usePresupuesto();
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);

  const importador = (
    <ImportarExcel
      onImportado={(texto) => {
        setAviso({ texto });
        recargar();
      }}
      onError={(texto) => setAviso({ texto, error: true })}
    />
  );

  return (
    <>
      <PageHeader title={meta.label} subtitle="Ambiente, Calidad y Laboratorios" actions={importador} />
      {aviso && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            aviso.error
              ? 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
          }`}
        >
          {aviso.texto}
        </p>
      )}

      {error ? (
        <Card className="py-12 text-center text-red-600">No se pudieron cargar los datos: {error}</Card>
      ) : !data ? (
        cargando && <Card className="py-12 text-center text-slate-500">Cargando presupuesto…</Card>
      ) : !data.gastos.length ? (
        <SinDatos />
      ) : (
        <TooltipLayer>
          <Tablero data={data} />
        </TooltipLayer>
      )}
    </>
  );
}

function Tablero({ data }: { data: PresupuestoData }) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);

  const registros = useMemo(() => prepararRegistros(data.gastos), [data]);
  const areas = useMemo(() => areasDisponibles(data, registros), [data, registros]);
  const anios = useMemo(() => aniosDisponibles(registros), [registros]);

  // Año por defecto: el actual si tiene datos; si no, el más reciente
  useEffect(() => {
    if (filtros.anio != null && anios.includes(filtros.anio)) return;
    const actual = new Date().getFullYear();
    setFiltros((f) => ({ ...f, anio: anios.includes(actual) ? actual : (anios[0] ?? null) }));
  }, [anios, filtros.anio]);

  const alternar = <K extends FiltroCruzado>(clave: K, valor: Filtros[K]) =>
    setFiltros((f) => ({ ...f, [clave]: f[clave] === valor ? null : valor }));

  const cambiarArea = (area: string) =>
    setFiltros((f) => ({ ...f, area, subarea: null, item: null, busqueda: '' }));

  const onBuscar = useCallback(
    (busqueda: string) => setFiltros((f) => (f.busqueda === busqueda ? f : { ...f, busqueda })),
    [],
  );

  const filtrados = useMemo(() => filtrar(registros, filtros), [registros, filtros]);
  const gasto = totalGasto(filtrados);
  const presupuesto = presupuestoVigente(data, filtros);
  const detalle = useMemo(() => buscar(filtrados, filtros.busqueda), [filtrados, filtros.busqueda]);

  // --- gráfico principal: gasto por área (vista general) o ítems con mayor gasto (vista de un área)
  const porArea = useMemo(() => {
    const g = agrupar(filtrar(registros, filtros), (r) => r.area);
    return areas.map((a) => ({
      key: a,
      label: a,
      valor: g.get(a) ?? 0,
      presupuesto: data.presupuestoArea.find((p) => p.area === a)?.monto ?? 0,
    }));
  }, [registros, filtros, areas, data]);

  const porItem = useMemo(() => {
    const g = agrupar(filtrar(registros, filtros, 'item'), (r) => r.itemNombre);
    return [...g].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, valor]) => ({ key, label: key, valor }));
  }, [registros, filtros]);

  const porSucursal = useMemo(() => {
    const g = agrupar(filtrar(registros, filtros, 'sucursal'), (r) => r.sucursalNombre);
    return [...g]
      .filter(([, v]) => v !== 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, valor]) => ({ key, label: key, valor }));
  }, [registros, filtros]);

  const porSubarea = useMemo(() => {
    const base = filtrar(registros, filtros, 'subarea');
    const g = agrupar(base, (r) => r.subarea);
    const items = new Map<string, { key: string; label: string; sublabel?: string; gasto: number; presupuesto: number }>();
    for (const p of data.presupuestoSubarea) {
      if (filtros.area !== AREA_GENERAL && p.area !== filtros.area) continue;
      const previo = items.get(p.subarea);
      items.set(p.subarea, {
        key: p.subarea,
        label: p.subarea,
        sublabel: filtros.area === AREA_GENERAL ? otraArea(p.area, p.subarea) : undefined,
        gasto: 0,
        presupuesto: (previo?.presupuesto ?? 0) + p.monto,
      });
    }
    for (const [subarea, valor] of g) {
      if (!subarea || subarea === '0') continue;
      const item = items.get(subarea) ?? {
        key: subarea,
        label: subarea,
        sublabel: filtros.area === AREA_GENERAL ? otraArea(base.find((r) => r.subarea === subarea)?.area, subarea) : undefined,
        gasto: 0,
        presupuesto: 0,
      };
      item.gasto = valor;
      items.set(subarea, item);
    }
    let lista = [...items.values()].sort((a, b) => (b.presupuesto || b.gasto) - (a.presupuesto || a.gasto));
    if (filtros.item || filtros.sucursal || filtros.mes != null) {
      lista = lista.filter((i) => i.gasto > 0 || i.key === filtros.subarea);
    }
    return lista;
  }, [registros, filtros, data]);

  const porMes = useMemo(() => {
    const g = agrupar(filtrar(registros, filtros, 'mes'), (r) => r.mes);
    let acumulado = 0;
    return MESES_LARGO.map((nombre, i) => {
      const valor = g.get(i) ?? 0;
      acumulado += valor;
      return {
        key: String(i),
        label: nombre.charAt(0).toUpperCase() + nombre.slice(1),
        valor,
        detalle: valor ? `Acumulado a ${nombre}: ${dinero(acumulado, 2)}` : 'Sin gastos registrados',
      };
    });
  }, [registros, filtros]);

  const titulo = filtros.area === AREA_GENERAL ? 'Presupuesto general' : `Presupuesto de ${filtros.area}`;
  const subtitulo = `${filtros.subarea ? `Sub-área ${filtros.subarea}` : `Presupuesto anual ${filtros.anio ?? ''}`} · ${dinero(presupuesto)}`;

  return (
    <>
      <EstadoDatos importacion={data.importacion} />
      <BarraFiltros
        filtros={filtros}
        areas={areas}
        anios={anios}
        onArea={cambiarArea}
        onAnio={(anio) => setFiltros((f) => ({ ...f, anio }))}
        onQuitar={(clave) =>
          setFiltros((f) =>
            clave === 'todo'
              ? { ...f, sucursal: null, item: null, subarea: null, mes: null, busqueda: '' }
              : { ...f, [clave]: clave === 'busqueda' ? '' : null },
          )
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
        <KpiPresupuesto
          titulo={titulo}
          subtitulo={subtitulo}
          gasto={gasto}
          presupuesto={presupuesto}
          registros={filtrados.length}
          proyeccion={proyeccionCierre(gasto, filtros)}
        />

        {filtros.area === AREA_GENERAL ? (
          <Card compact title="Gasto por área">
            <ColumnChart
              items={porArea}
              alto={300}
              formato={dineroCorto}
              formatoLargo={dinero2}
              onSelect={cambiarArea}
              subtexto={(i) => (i.presupuesto ? `${porcentaje(i.valor / i.presupuesto)} de ${dineroCorto(i.presupuesto)}` : 'sin presupuesto')}
              detalleTip={(i) => (i.presupuesto ? `Presupuesto ${dinero(i.presupuesto)}` : 'Sin presupuesto')}
            />
          </Card>
        ) : (
          <Card compact title="Ítems con mayor gasto">
            <BarList
              items={porItem}
              formato={dineroCorto}
              formatoLargo={dinero2}
              seleccion={filtros.item}
              onSelect={(k) => alternar('item', k)}
            />
          </Card>
        )}

        <Card compact title="Gasto por mes" className="md:col-span-2 xl:col-span-1">
          <BarList
            items={porMes}
            formato={dineroCorto}
            formatoLargo={dinero2}
            seleccion={filtros.mes != null ? String(filtros.mes) : null}
            onSelect={(k) => alternar('mes', Number(k))}
          />
        </Card>

        <Card compact title="Presupuesto vs. gasto por sub-área" className="md:col-span-2">
          <BudgetBars
            items={porSubarea}
            formato={dineroCorto}
            formatoLargo={dinero2}
            porcentaje={porcentaje}
            seleccion={filtros.subarea}
            onSelect={(k) => alternar('subarea', k)}
          />
        </Card>

        <Card compact title="Gasto por sucursal" className="md:col-span-2 xl:col-span-1">
          <BarList
            items={porSucursal}
            limite={12}
            formato={dineroCorto}
            formatoLargo={dinero2}
            seleccion={filtros.sucursal}
            onSelect={(k) => alternar('sucursal', k)}
          />
        </Card>

        <div className="md:col-span-2 xl:col-span-3">
          <DetalleGastos registros={detalle} busqueda={filtros.busqueda} onBuscar={onBuscar} />
        </div>
      </div>
    </>
  );
}

function EstadoDatos({ importacion }: { importacion: Importacion | null }) {
  if (!importacion) return null;
  const fecha = new Date(importacion.importadoEn);
  const dias = (Date.now() - fecha.getTime()) / 864e5;
  const texto = `${fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}, ${fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
  return (
    <p className="-mt-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dias > 8 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        Datos importados el {texto}
        {dias > 8 && ' (hace más de una semana)'}
      </span>
      <span>Fuente: {importacion.archivo}</span>
    </p>
  );
}

function SinDatos() {
  return (
    <Card className="flex flex-col items-center py-16 text-center">
      <FileSpreadsheet size={40} className="text-brand-500" />
      <p className="mt-4 text-lg font-semibold">Aún no hay datos de presupuesto</p>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Pulse <b>Importar Excel</b> y elija el archivo <i>Control de presupuesto SIG</i>. Debe tener las tablas
        Consulta2, PresupuestoTipo y PresuestoArea.
      </p>
    </Card>
  );
}

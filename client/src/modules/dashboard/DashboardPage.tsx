import { useMemo, useState, type ComponentType } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  FlaskConical,
  Gauge as IconoOxigenometro,
  SearchCheck,
  Wallet,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react';
import { BarList } from '@/components/charts/BarList';
import { BudgetBars } from '@/components/charts/BudgetBars';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { Gauge } from '@/components/charts/Gauge';
import { TooltipLayer } from '@/components/charts/Tooltip';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { formatLongDate } from '@/utils/fechas';
import { dinero, dineroCorto, miles, porcentaje } from '@/utils/numeros';
import type { SeccionId } from '@/modules/laboratorios/analisis/types';
import { BarrasLimite } from './components/BarrasLimite';
import { CruceCentros } from './components/CruceCentros';
import { Cifra, Grafico, SeccionTablero, SinDatosSeccion } from './components/SeccionTablero';
import { useDatosTablero, type Fuente } from './hooks/useDatosTablero';
import {
  aniosConDatos,
  NOMBRE_SECCION,
  SIN_FILTROS_LAB,
  type FiltrosLaboratorio,
  resumenCalendario,
  resumenInspecciones,
  resumenLaboratorio,
  resumenMonitoreo,
  resumenOxigenometros,
  resumenPresupuesto,
} from './logic/resumen';

const cantidad = (n: number) => miles(n);

const CHIP = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition';
const CHIP_ACTIVO = 'border-transparent bg-brand-900 text-white dark:bg-sky-600';
const CHIP_INACTIVO = 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-transparent dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';

type Datos = NonNullable<ReturnType<typeof useDatosTablero>>;
type IdSeccion = 'monitoreo' | 'laboratorio' | 'inspecciones' | 'calendario' | 'oxigenometros' | 'presupuesto';

/** Secciones del Dashboard, en el orden en que se muestran */
const SECCIONES: { id: IdSeccion; titulo: string; icono: LucideIcon; Componente: ComponentType<{ datos: Datos; anio: number }> }[] = [
  { id: 'monitoreo', titulo: 'Monitoreo de agua', icono: Waves, Componente: ({ datos, anio }) => <SeccionMonitoreo fuente={datos.monitoreo} anio={anio} /> },
  { id: 'laboratorio', titulo: 'Laboratorios de análisis', icono: FlaskConical, Componente: ({ datos, anio }) => <SeccionLaboratorio fuente={datos.informes} anio={anio} /> },
  { id: 'inspecciones', titulo: 'Inspecciones SCI', icono: SearchCheck, Componente: ({ datos, anio }) => <SeccionInspecciones fuente={datos.revisiones} anio={anio} /> },
  { id: 'calendario', titulo: 'Calendario y auditorías', icono: CalendarDays, Componente: ({ datos, anio }) => <SeccionCalendario fuente={datos.eventos} anio={anio} /> },
  { id: 'oxigenometros', titulo: 'Oxigenómetros', icono: IconoOxigenometro, Componente: ({ datos, anio }) => <SeccionOxigenometros fuente={datos.reparaciones} anio={anio} /> },
  { id: 'presupuesto', titulo: 'Presupuesto', icono: Wallet, Componente: ({ datos, anio }) => <SeccionPresupuesto fuente={datos.presupuesto} anio={anio} /> },
];
const TODAS = SECCIONES.map((s) => s.id);
const CLAVE_SECCIONES = 'sig-tablero-secciones';

/** Secciones elegidas: se recuerdan en este navegador (si no se puede leer, se ven todas) */
function useSeccionesElegidas() {
  const [elegidas, setElegidas] = useState<IdSeccion[]>(() => {
    try {
      const guardadas: unknown = JSON.parse(localStorage.getItem(CLAVE_SECCIONES) ?? 'null');
      if (Array.isArray(guardadas)) return TODAS.filter((id) => guardadas.includes(id));
    } catch {
      /* sin almacenamiento: se ven todas */
    }
    return TODAS;
  });
  const guardar = (lista: IdSeccion[]) => {
    setElegidas(lista);
    try {
      localStorage.setItem(CLAVE_SECCIONES, JSON.stringify(lista));
    } catch {
      /* no se pudo recordar; igual se aplica */
    }
  };
  const alternar = (id: IdSeccion) => guardar(elegidas.includes(id) ? elegidas.filter((x) => x !== id) : TODAS.filter((x) => x === id || elegidas.includes(x)));
  return { elegidas, alternar, todas: () => guardar(TODAS) };
}

/** Dashboard: gráficos de cada sección del sistema para el año elegido */
export function DashboardPage() {
  const { nombreVisible } = useAuth();
  const datos = useDatosTablero();
  const anios = useMemo(
    () =>
      aniosConDatos([
        ...(datos?.presupuesto.datos?.gastos.map((g) => g.fechaSolped) ?? []),
        ...(datos?.informes.datos?.informes.map((i) => i.fechaEmision) ?? []),
        ...(datos?.reparaciones.datos?.map((r) => r.fecha) ?? []),
        ...(datos?.monitoreo.datos?.resultados.map((r) => r.fechaMuestreo) ?? []),
        ...(datos?.revisiones.datos?.map((r) => r.fecha) ?? []),
        ...(datos?.eventos.datos?.map((e) => e.fechaInicio) ?? []),
      ]),
    [datos],
  );
  const [anio, setAnio] = useState(new Date().getFullYear());
  const { elegidas, alternar, todas } = useSeccionesElegidas();
  const visibles = SECCIONES.filter((x) => elegidas.includes(x.id));

  const selector = (
    <label className="flex items-center gap-2 text-sm font-semibold">
      Año
      <select
        value={anio}
        onChange={(e) => setAnio(Number(e.target.value))}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      <PageHeader title={`Bienvenido, ${nombreVisible}`} subtitle={formatLongDate(new Date())} actions={selector} />
      <div className="mb-5 flex flex-wrap items-center gap-1.5" role="group" aria-label="Secciones que se muestran">
        <span className="mr-1 text-sm font-semibold">Secciones</span>
        <button
          type="button"
          aria-pressed={elegidas.length === TODAS.length}
          onClick={todas}
          className={`${CHIP} ${elegidas.length === TODAS.length ? CHIP_ACTIVO : CHIP_INACTIVO}`}
        >
          Todas
        </button>
        {SECCIONES.map(({ id, titulo, icono: Icono }) => {
          const activa = elegidas.includes(id);
          return (
            <button key={id} type="button" aria-pressed={activa} onClick={() => alternar(id)} className={`${CHIP} ${activa ? CHIP_ACTIVO : CHIP_INACTIVO}`}>
              {activa ? <Check size={13} aria-hidden /> : <Icono size={13} aria-hidden />}
              {titulo}
            </button>
          );
        })}
      </div>
      {!datos ? (
        <p className="text-sm text-slate-500">Cargando los gráficos…</p>
      ) : !visibles.length ? (
        <SinDatosSeccion texto="No hay secciones elegidas. Marca arriba las que quieres ver." />
      ) : (
        <TooltipLayer>
          {/* Con una sola sección, ocupa todo el ancho */}
          <div className={`grid grid-flow-dense grid-cols-1 items-start gap-6 ${visibles.length > 1 ? 'xl:grid-cols-2' : ''}`}>
            {visibles.map(({ id, Componente }) => (
              <Componente key={id} datos={datos} anio={anio} />
            ))}
          </div>
        </TooltipLayer>
      )}
    </>
  );
}

/** La sección no se pudo leer: lo dice sin tapar a las demás */
function ErrorSeccion<T>({ fuente }: { fuente: Fuente<T> }) {
  return fuente.error ? <SinDatosSeccion texto={`No se pudieron leer los datos: ${fuente.error}`} /> : null;
}

function SeccionMonitoreo({ fuente, anio }: { fuente: DatosFuente<'monitoreo'>; anio: number }) {
  const r = fuente.datos && resumenMonitoreo(fuente.datos.resultados, fuente.datos.definicion, anio);
  return (
    <SeccionTablero
      titulo="Monitoreo de agua"
      icono={Waves}
      ruta="/monitoreo-agua"
      ancha
      cifras={
        r && (
          <>
            <Cifra etiqueta="Resultados del laboratorio" valor={cantidad(r.resultados)} detalle={`${r.efluente} efluente · ${r.afluente} afluente`} />
            <Cifra etiqueta="Informes PGC-025" valor={cantidad(r.informes)} detalle="Uno por camaronera" />
            <Cifra
              etiqueta="Superan el límite"
              valor={cantidad(r.conIncumplimiento)}
              detalle={r.efluente ? (r.conIncumplimiento ? 'Revisar resultados' : 'Todos cumplen') : 'Sin resultados'}
              estado={r.efluente ? (r.conIncumplimiento ? { tipo: 'alerta', icono: AlertTriangle } : { tipo: 'bien', icono: CheckCircle2 }) : undefined}
            />
            <Cifra
              etiqueta="pH del efluente"
              valor={r.ph ? `${miles(r.ph.min, 2)} – ${miles(r.ph.max, 2)}` : '—'}
              detalle={r.ph ? `Permitido ${r.ph.limite}` : 'Sin datos'}
            />
          </>
        )
      }
    >
      <ErrorSeccion fuente={fuente} />
      {r && !r.resultados && <SinDatosSeccion texto={`No hay resultados de análisis de agua en ${anio}.`} />}
      {r && r.resultados > 0 && (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Grafico titulo="Parámetros del efluente frente a su límite" nota="Valor más alto del año, en % del límite máximo permisible (AM 097a)">
            <BarrasLimite filas={r.parametros} />
          </Grafico>
          <Grafico titulo="Resultados por mes" nota="Según la fecha de muestreo">
            <ColumnChart enteros items={r.porMes} formato={cantidad} formatoLargo={(v) => `${miles(v)} ${v === 1 ? 'resultado' : 'resultados'}`} alto={220} />
          </Grafico>
        </div>
      )}
    </SeccionTablero>
  );
}

function SeccionLaboratorio({ fuente, anio }: { fuente: DatosFuente<'informes'>; anio: number }) {
  const [f, setF] = useState<FiltrosLaboratorio>(SIN_FILTROS_LAB);
  const r = fuente.datos && resumenLaboratorio(fuente.datos.informes, fuente.datos.definicion, anio, f);
  const informes = (v: number) => `${miles(v)} ${v === 1 ? 'informe' : 'informes'}`;
  const hayFiltro = Boolean(f.seccion || f.analisis || f.centro);
  // El centro elegido sigue en la lista aunque no tenga informes en el año
  const centros = r ? (f.centro && !r.centros.includes(f.centro) ? [f.centro, ...r.centros] : r.centros) : [];

  const filtros = r && (
    <>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tipo de análisis">
        {([null, 'agua', 'suelo', 'patologia'] as (SeccionId | null)[]).map((s) => (
          <button
            key={s ?? 'todos'}
            type="button"
            aria-pressed={f.seccion === s}
            // Al cambiar el tipo se quita el análisis específico (podría ser de otro tipo)
            onClick={() => setF({ ...f, seccion: s, analisis: null })}
            className={`${CHIP} ${f.seccion === s ? CHIP_ACTIVO : CHIP_INACTIVO}`}
          >
            {s ? NOMBRE_SECCION[s] : 'Todos los análisis'}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold">
        Centro de costo
        <select
          value={f.centro ?? ''}
          onChange={(e) => setF({ ...f, centro: e.target.value || null })}
          className="max-w-56 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Todos</option>
          {centros.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      {f.analisis && (
        <button
          type="button"
          onClick={() => setF({ ...f, analisis: null })}
          className={`${CHIP} ${CHIP_ACTIVO}`}
          aria-label={`Quitar el filtro ${r.nombreAnalisis(f.analisis)}`}
        >
          {r.nombreAnalisis(f.analisis)} <X size={13} aria-hidden />
        </button>
      )}
      {hayFiltro && (
        <button type="button" onClick={() => setF(SIN_FILTROS_LAB)} className="text-xs font-semibold text-brand-500 hover:underline">
          Quitar filtros
        </button>
      )}
    </>
  );

  return (
    <SeccionTablero
      titulo="Laboratorios de análisis"
      icono={FlaskConical}
      ruta="/laboratorios"
      ancha
      filtros={filtros}
      cifras={
        r && (
          <>
            <Cifra etiqueta="Informes emitidos" valor={cantidad(r.informes)} />
            <Cifra etiqueta="Muestras analizadas" valor={cantidad(r.muestras)} />
            <Cifra etiqueta="Centros de costo atendidos" valor={cantidad(r.centrosAtendidos)} />
            <Cifra
              etiqueta="Días de entrega (promedio)"
              valor={r.diasEntrega == null ? '—' : miles(r.diasEntrega, 1)}
              detalle={r.diasEntrega == null ? 'Sin fechas de muestra' : 'De la toma de muestra a la emisión'}
            />
          </>
        )
      }
    >
      <ErrorSeccion fuente={fuente} />
      {r && !r.informes && <SinDatosSeccion texto={hayFiltro ? `No hay informes con estos filtros en ${anio}.` : `No hay informes de laboratorio en ${anio}.`} />}
      {r && r.informes > 0 && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Grafico titulo="Informes por mes" nota="Según la fecha de emisión">
              <ColumnChart
                enteros
                items={r.porMes}
                formato={cantidad}
                formatoLargo={informes}
                alto={220}
                detalleTip={(i) => r.porMes.find((m) => m.key === i.key)?.detalle}
              />
            </Grafico>
            <Grafico titulo="Análisis realizados" nota="Informes que incluyen cada análisis · toca uno para filtrar">
              <BarList
                items={r.porAnalisis}
                formato={cantidad}
                formatoLargo={informes}
                seleccion={f.analisis}
                onSelect={(k) => setF({ ...f, analisis: f.analisis === k ? null : k })}
              />
            </Grafico>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Grafico titulo="Informes por centro de costo" nota="Toca uno para filtrar">
              <BarList
                items={r.porCentro}
                formato={cantidad}
                formatoLargo={informes}
                limite={8}
                seleccion={f.centro}
                onSelect={(k) => setF({ ...f, centro: f.centro === k ? null : k })}
              />
            </Grafico>
            <Grafico titulo="Análisis por centro de costo" nota="Informes de cada análisis en cada centro">
              <CruceCentros columnas={r.cruce.columnas} filas={r.cruce.filas} />
            </Grafico>
          </div>
        </>
      )}
    </SeccionTablero>
  );
}

function SeccionInspecciones({ fuente, anio }: { fuente: DatosFuente<'revisiones'>; anio: number }) {
  const r = fuente.datos && resumenInspecciones(fuente.datos, anio);
  return (
    <SeccionTablero
      titulo="Inspecciones SCI"
      icono={SearchCheck}
      ruta="/inspecciones-sci"
      cifras={
        r && (
          <>
            <Cifra etiqueta="Revisiones del check list" valor={cantidad(r.revisiones)} />
            <Cifra etiqueta="Sucursales revisadas" valor={cantidad(r.sucursales)} />
            <Cifra
              etiqueta="Cumplimiento promedio"
              valor={r.promedio == null ? '—' : porcentaje(r.promedio)}
              detalle={r.promedio == null ? 'Sin revisiones' : 'Última revisión de cada sucursal'}
            />
          </>
        )
      }
    >
      <ErrorSeccion fuente={fuente} />
      {r && !r.revisiones && <SinDatosSeccion texto={`No hay revisiones del check list en ${anio}.`} />}
      {r && r.revisiones > 0 && (
        <Grafico titulo="Cumplimiento por sucursal" nota="Requisitos que cumplen, en la última revisión del año (de menor a mayor)">
          <BarList items={r.porSucursal} formato={porcentaje} />
        </Grafico>
      )}
    </SeccionTablero>
  );
}

function SeccionCalendario({ fuente, anio }: { fuente: DatosFuente<'eventos'>; anio: number }) {
  const r = fuente.datos && resumenCalendario(fuente.datos, anio);
  const fechas = (v: number) => `${miles(v)} ${v === 1 ? 'fecha' : 'fechas'}`;
  return (
    <SeccionTablero
      titulo="Calendario y auditorías"
      icono={CalendarDays}
      ruta="/calendario"
      cifras={
        r && (
          <>
            <Cifra etiqueta="Fechas del año" valor={cantidad(r.total)} detalle={`${miles(r.auditorias)} ${r.auditorias === 1 ? 'auditoría' : 'auditorías'} ASC / BAP`} />
            <Cifra etiqueta="Próximas" valor={cantidad(r.proximos)} />
            <Cifra
              etiqueta="Vencidas"
              valor={cantidad(r.vencidos)}
              detalle={r.vencidos ? 'Sin marcar como realizadas' : r.total ? 'Ninguna vencida' : undefined}
              estado={r.total ? (r.vencidos ? { tipo: 'alerta', icono: AlertTriangle } : { tipo: 'bien', icono: CheckCircle2 }) : undefined}
            />
            <Cifra etiqueta="Realizadas" valor={cantidad(r.realizados)} />
          </>
        )
      }
    >
      <ErrorSeccion fuente={fuente} />
      {r && !r.total && <SinDatosSeccion texto={`No hay fechas en el calendario para ${anio}.`} />}
      {r && r.total > 0 && (
        <>
          <Grafico titulo="Fechas por mes" nota="Auditorías, inspecciones, capacitaciones, mantenimientos y vencimientos">
            <ColumnChart enteros items={r.porMes} formato={cantidad} formatoLargo={fechas} alto={200} />
          </Grafico>
          <Grafico titulo="Fechas por tipo">
            <BarList items={r.porTipo} formato={cantidad} formatoLargo={fechas} />
          </Grafico>
        </>
      )}
    </SeccionTablero>
  );
}

function SeccionOxigenometros({ fuente, anio }: { fuente: DatosFuente<'reparaciones'>; anio: number }) {
  const r = fuente.datos && resumenOxigenometros(fuente.datos, anio);
  return (
    <SeccionTablero
      titulo="Oxigenómetros"
      icono={IconoOxigenometro}
      ruta="/laboratorios/oxigenometros"
      cifras={
        r && (
          <>
            <Cifra etiqueta="Partes reparadas" valor={cantidad(r.partesReparadas)} />
            <Cifra etiqueta="Ahorro" valor={dineroCorto(r.ahorro)} detalle="Lo que no se gastó en partes nuevas" />
            <Cifra etiqueta="En reparación" valor={cantidad(r.enReparacion)} />
            <Cifra etiqueta="No reparables" valor={cantidad(r.noReparables)} />
          </>
        )
      }
    >
      <ErrorSeccion fuente={fuente} />
      {r && !r.reparaciones && <SinDatosSeccion texto={`No hay reparaciones de oxigenómetros en ${anio}.`} />}
      {r && r.reparaciones > 0 && (
        <Grafico titulo="Ahorro por mes" nota="Precio de la parte nueva × cantidad, de las partes reparadas">
          <ColumnChart items={r.porMes} formato={dineroCorto} formatoLargo={(v) => dinero(v)} alto={200} detalleTip={(i) => r.porMes.find((m) => m.key === i.key)?.detalle} />
        </Grafico>
      )}
    </SeccionTablero>
  );
}

function SeccionPresupuesto({ fuente, anio }: { fuente: DatosFuente<'presupuesto'>; anio: number }) {
  const r = fuente.datos && resumenPresupuesto(fuente.datos, anio);
  return (
    <SeccionTablero titulo="Presupuesto" icono={Wallet} ruta="/presupuesto" ancha>
      <ErrorSeccion fuente={fuente} />
      {fuente.datos && !fuente.datos.gastos.length && <SinDatosSeccion texto="Aún no se ha importado el Excel del presupuesto." />}
      {r && fuente.datos!.gastos.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_1fr]">
          <div className="text-center lg:w-64">
            <p className="text-xs text-slate-500 dark:text-slate-400">Gastado en {anio}</p>
            <p className="text-4xl leading-tight font-semibold">{dineroCorto(r.gasto)}</p>
            <Gauge
              fraccion={r.presupuesto ? r.gasto / r.presupuesto : 0}
              valor={porcentaje(r.presupuesto ? r.gasto / r.presupuesto : NaN)}
              etiqueta="ejecutado"
              minLabel="$0"
              maxLabel={dineroCorto(r.presupuesto)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">{miles(r.registros)} registros de gasto</p>
          </div>
          <Grafico titulo="Gasto por mes" nota="Según la fecha de la solped">
            <ColumnChart
              items={r.porMes}
              formato={dineroCorto}
              formatoLargo={(v) => dinero(v)}
              alto={220}
              detalleTip={(i) => r.porMes.find((m) => m.key === i.key)?.detalle}
            />
          </Grafico>
          <div className="flex flex-col gap-5">
            <Grafico titulo="Gasto frente al presupuesto por área">
              <BudgetBars items={r.porArea} formato={dineroCorto} formatoLargo={(v) => dinero(v)} porcentaje={porcentaje} />
            </Grafico>
            <Grafico titulo="Gasto por sucursal">
              <BarList items={r.porSucursal} formato={dineroCorto} formatoLargo={(v) => dinero(v)} limite={5} />
            </Grafico>
          </div>
        </div>
      )}
    </SeccionTablero>
  );
}

type DatosFuente<K extends keyof NonNullable<ReturnType<typeof useDatosTablero>>> = NonNullable<ReturnType<typeof useDatosTablero>>[K];

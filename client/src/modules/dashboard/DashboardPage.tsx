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
  type LucideIcon,
} from 'lucide-react';
import { AreaChart } from '@/components/charts/AreaChart';
import { BarList } from '@/components/charts/BarList';
import { BudgetBars } from '@/components/charts/BudgetBars';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { Gauge } from '@/components/charts/Gauge';
import { TooltipLayer } from '@/components/charts/Tooltip';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { formatLongDate } from '@/utils/fechas';
import { dinero, dineroCorto, miles, porcentaje } from '@/utils/numeros';
import { BarrasLimite } from './components/BarrasLimite';
import { TablaResultados } from './components/TablaResultados';
import { Cifra, Grafico, SeccionTablero, SinDatosSeccion } from './components/SeccionTablero';
import { useDatosTablero, type Fuente } from './hooks/useDatosTablero';
import {
  aniosConDatos,
  resumenCalendario,
  resumenInspecciones,
  resumenMonitoreo,
  resumenOxigenometros,
  resumenPresupuesto,
} from './logic/resumen';
import { ANALISIS_LAB, referenciaDe, resumenResultados, unidadDe, valorTexto } from './logic/resultadosLab';

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
        ...(datos?.informes.datos?.informes.map((i) => i.fechaMuestra || i.fechaEmision) ?? []),
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

/** La línea de tendencia no une fechas separadas por más de un mes y medio (períodos sin análisis) */
const CORTE_LINEA = 45 / 365;

/** Referencia fija del parámetro (la que depende de la salinidad no se puede dibujar como línea) */
const refFija = (c: { min?: number; max?: number; factorSalinidad?: number }) => (c.factorSalinidad ? {} : { min: c.min, max: c.max });

function SeccionLaboratorio({ fuente, anio }: { fuente: DatosFuente<'informes'>; anio: number }) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [centro, setCentro] = useState<string | null>(null);
  const [piscina, setPiscina] = useState<string | null>(null);
  const [agrupar, setAgrupar] = useState<'campamento' | 'piscina'>('campamento');
  const [parametro, setParametro] = useState<string | null>(null);

  const datos = fuente.datos;
  // Sin elección, el primer análisis con muestras en el año
  const r = useMemo(() => {
    if (!datos) return null;
    const base = { centro: null, piscina: null, agrupar: 'campamento' as const, parametro: null };
    const previo = resumenResultados(datos.informes, datos.definicion, anio, { ...base, analisis: elegido ?? ANALISIS_LAB[0].id });
    const analisis = elegido ?? ANALISIS_LAB.find((a) => previo.disponibles[a.id] > 0)?.id ?? ANALISIS_LAB[0].id;
    return resumenResultados(datos.informes, datos.definicion, anio, { analisis, centro, piscina, agrupar, parametro });
  }, [datos, anio, elegido, centro, piscina, agrupar, parametro]);

  const p = r?.parametro;
  // Química del agua: líneas con área (evolución de cada parámetro) en lugar de columnas
  const quimica = r?.analisis.id === 'quimica';
  const tendencia = r?.tendencias.find((t) => t.campo.clave === p?.clave);
  const unidad = p ? unidadDe(p) : '';
  const conUnidad = (v: number) => `${valorTexto(v)} ${unidad}`.trim();
  const centros = r ? (centro && !r.centros.includes(centro) ? [centro, ...r.centros] : r.centros) : [];
  const hayMuestras = Boolean(r && r.muestras > 0);
  const nivel = r?.nivel ?? 'campamento';
  const elegirCentro = (c: string | null) => {
    setCentro(c);
    setPiscina(null);
  };
  /** Baja un nivel desde una barra o una fila: campamento → sus piscinas → historial de una piscina */
  const bajar = (key: string) => {
    if (nivel === 'campamento') elegirCentro(key);
    else if (nivel === 'piscina') {
      const [c, pis] = key.split('|');
      setCentro(c);
      setPiscina(pis);
    }
  };
  const SELECT = 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900';
  const que = nivel === 'muestra' ? 'análisis' : nivel;
  const nombreNivel = { campamento: 'Campamento', piscina: 'Piscina', muestra: 'Fecha' }[nivel];

  const filtros = r && (
    <>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Análisis">
        {ANALISIS_LAB.map((a) => {
          const activo = r.analisis.id === a.id;
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={activo}
              onClick={() => {
                setElegido(a.id);
                setParametro(null);
                setPiscina(null);
              }}
              className={`${CHIP} ${activo ? CHIP_ACTIVO : CHIP_INACTIVO}`}
            >
              {a.nombre}
              <span className={`tabular-nums ${activo ? 'opacity-80' : 'text-slate-400 dark:text-slate-500'}`}>{r.disponibles[a.id]}</span>
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold">
        Campamento
        <select value={centro ?? ''} onChange={(e) => elegirCentro(e.target.value || null)} className={`max-w-56 ${SELECT}`}>
          <option value="">Todos</option>
          {centros.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      {centro ? (
        <label className="flex items-center gap-2 text-xs font-semibold">
          Piscina
          <select value={r.piscina ?? ''} onChange={(e) => setPiscina(e.target.value || null)} className={`max-w-40 ${SELECT}`}>
            <option value="">Todas ({r.piscinas.length})</option>
            {r.piscinas.map((x) => (
              <option key={x.key} value={x.key}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="flex items-center gap-1 text-xs font-semibold" role="group" aria-label="Agrupar los resultados">
          Ver por
          {(['campamento', 'piscina'] as const).map((a) => (
            <button key={a} type="button" aria-pressed={agrupar === a} onClick={() => setAgrupar(a)} className={`${CHIP} ${agrupar === a ? CHIP_ACTIVO : CHIP_INACTIVO}`}>
              {a === 'campamento' ? 'Campamento' : 'Piscina'}
            </button>
          ))}
        </div>
      )}
      {r.campos.length > 0 && (
        <label className="flex items-center gap-2 text-xs font-semibold">
          Parámetro
          <select value={p?.clave ?? ''} onChange={(e) => setParametro(e.target.value)} className={`max-w-64 ${SELECT}`}>
            {r.campos.map((c) => (
              <option key={c.clave} value={c.clave}>
                {c.etiqueta}
              </option>
            ))}
          </select>
        </label>
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
            <Cifra etiqueta="Muestras analizadas" valor={cantidad(r.muestras)} detalle={r.ultima ? `Última: ${r.ultima}` : 'Sin muestras'} />
            {r.piscina ? (
              <Cifra etiqueta="Piscina" valor={r.nombrePiscina ?? ''} detalle={centro ?? undefined} />
            ) : centro ? (
              <Cifra etiqueta="Piscinas analizadas" valor={cantidad(r.cantidadPiscinas)} detalle={centro} />
            ) : (
              <Cifra etiqueta="Campamentos" valor={cantidad(r.campamentos)} detalle={`${miles(r.cantidadPiscinas)} piscinas`} />
            )}
            {r.valoresConRef > 0 && (
              <Cifra
                etiqueta="Valores fuera de referencia"
                valor={cantidad(r.valoresFuera)}
                detalle={`de ${miles(r.valoresConRef)} valores con referencia`}
                estado={r.valoresFuera ? { tipo: 'alerta', icono: AlertTriangle } : { tipo: 'bien', icono: CheckCircle2 }}
              />
            )}
            {r.analisis.id === 'fresco' && hayMuestras && (
              <Cifra
                etiqueta="Hallazgos en nivel alto o más"
                valor={cantidad(r.nivelesAltos)}
                detalle="Grado 2 o mayor"
                estado={r.nivelesAltos ? { tipo: 'alerta', icono: AlertTriangle } : { tipo: 'bien', icono: CheckCircle2 }}
              />
            )}
          </>
        )
      }
    >
      <ErrorSeccion fuente={fuente} />
      {r && !hayMuestras && (
        <SinDatosSeccion texto={`No hay resultados de ${r.analisis.nombre.toLowerCase()}${centro ? ` en ${centro}` : ''} en ${anio}.`} />
      )}
      {r && hayMuestras && p && (
        <>
          <div className={`grid gap-6 ${quimica ? '' : 'lg:grid-cols-2'}`}>
            {nivel === 'muestra' ? (
              // En química, la evolución de la piscina va en el gráfico de línea (no se repite en columnas)
              !quimica && (
              <Grafico
                titulo={`${p.etiqueta} en ${r.nombrePiscina}, análisis por análisis`}
                nota={['Cómo cambió en cada análisis del año', unidad, referenciaDe(p)].filter(Boolean).join(' · ')}
              >
                <ColumnChart items={r.porFecha} formato={valorTexto} formatoLargo={conUnidad} alto={220} detalleTip={(i) => r.porFecha.find((m) => m.key === i.key)?.detalle} />
              </Grafico>
              )
            ) : (
              <Grafico
                titulo={`${p.etiqueta} por ${nivel}`}
                nota={[
                  `Promedio de sus muestras · toca ${nivel === 'campamento' ? 'uno para ver sus piscinas' : 'una para ver su historial'}`,
                  unidad,
                  referenciaDe(p),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              >
                <BarList items={r.barras} formato={valorTexto} formatoLargo={conUnidad} limite={12} onSelect={bajar} />
              </Grafico>
            )}
            {quimica && tendencia ? (
              <Grafico
                titulo={`${p.etiqueta}: tendencia ${nivel === 'muestra' ? `de ${r.nombrePiscina}` : centro ? `de ${centro}` : 'de todos los campamentos'}`}
                nota={[nivel === 'muestra' ? 'Cada punto es un análisis' : 'Punto pequeño: cada muestra · línea: promedio de cada fecha', unidad, referenciaDe(p), 'rojo: fuera de la referencia']
                  .filter(Boolean)
                  .join(' · ')}
              >
                <AreaChart puntos={tendencia.puntos} ticksX={r.mesesEje} corte={CORTE_LINEA} formato={valorTexto} formatoLargo={conUnidad} alto={260} min={refFija(p).min} max={refFija(p).max} />
              </Grafico>
            ) : (
              <Grafico titulo={`${p.etiqueta} por mes`} nota={['Promedio de las muestras de cada mes', unidad].filter(Boolean).join(' · ')}>
                <ColumnChart items={r.porMes} formato={valorTexto} formatoLargo={conUnidad} alto={220} detalleTip={(i) => r.porMes.find((m) => m.key === i.key)?.detalle} />
              </Grafico>
            )}
          </div>
          {quimica && (
            <Grafico
              titulo="Evolución de cada parámetro"
              nota={`${nivel === 'muestra' ? `Análisis por análisis de ${r.nombrePiscina}` : `Todas las muestras ${centro ? `de ${centro}` : 'de todos los campamentos'} y el promedio de cada fecha`} · línea punteada: referencia · toca un parámetro para verlo en grande`}
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {r.tendencias
                  .filter((t) => t.puntos.length > 0)
                  .map((t) => {
                    const u = unidadDe(t.campo);
                    const activo = t.campo.clave === p.clave;
                    return (
                      <div key={t.campo.clave} className={`min-w-0 rounded-lg border p-3 ${activo ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-800'}`}>
                        <button type="button" aria-pressed={activo} onClick={() => setParametro(t.campo.clave)} className="block w-full text-left">
                          <span className="block truncate text-[13px] font-semibold">{t.campo.etiqueta}</span>
                          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{[u, referenciaDe(t.campo)].filter(Boolean).join(' · ') || ' '}</span>
                        </button>
                        <AreaChart
                          puntos={t.puntos}
                          ticksX={r.mesesEje}
                          corte={CORTE_LINEA}
                          formato={valorTexto}
                          formatoLargo={(v) => `${valorTexto(v)} ${u}`.trim()}
                          alto={150}
                          min={refFija(t.campo).min}
                          max={refFija(t.campo).max}
                          compacto
                        />
                      </div>
                    );
                  })}
              </div>
            </Grafico>
          )}
          {r.hallazgos.length > 0 && (
            <Grafico titulo="Hallazgos por grado promedio" nota="Del más grave al más leve · toca un hallazgo para graficarlo">
              <BarList items={r.hallazgos} formato={valorTexto} formatoLargo={(v) => `Grado ${valorTexto(v)}`} seleccion={p.clave} onSelect={setParametro} />
            </Grafico>
          )}
          {r.generos.length > 0 && (
            <Grafico titulo="Géneros encontrados" nota="Porcentaje de muestras en que aparece cada género">
              <BarList items={r.generos} formato={porcentaje} />
            </Grafico>
          )}
          <Grafico
            titulo={nivel === 'muestra' ? `Historial de ${r.nombrePiscina} (${centro})` : `Resultados por ${que}`}
            nota={[
              nivel === 'muestra' ? 'Todos los parámetros de cada análisis' : 'Promedio de las muestras',
              r.conReferencia ? (nivel === 'muestra' ? '▲ sobre · ▼ bajo la referencia' : '▲n / ▼n: muestras sobre / bajo la referencia') : null,
              r.hallazgos.length ? 'grado 0 ausencia · 0,1–0,9 bajo · 1–1,9 medio · 2–2,9 alto · 3–4 muy alto' : null,
              nivel !== 'muestra' ? `toca ${nivel === 'campamento' ? 'un campamento' : 'una piscina'} para ver el detalle` : null,
              'toca un parámetro para graficarlo',
            ]
              .filter(Boolean)
              .join(' · ')}
          >
            <TablaResultados
              campos={r.campos}
              filas={r.filas}
              parametro={p.clave}
              onParametro={setParametro}
              titulo={nombreNivel}
              onFila={nivel === 'muestra' ? undefined : bajar}
            />
          </Grafico>
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

import { useMemo, useState, type ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  Atom,
  Ban,
  Beaker,
  Bone,
  Bug,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Component,
  Droplets,
  FileText,
  FlaskConical,
  FlaskRound,
  Gauge as IconoOxigenometro,
  Gem,
  Hammer,
  Hexagon,
  Leaf,
  MapPin,
  Microscope,
  Orbit,
  Percent,
  PiggyBank,
  SearchCheck,
  Shapes,
  TestTube,
  TrendingUp,
  Wallet,
  Waves,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { BarList } from '@/components/charts/BarList';
import { BudgetBars } from '@/components/charts/BudgetBars';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { Gauge } from '@/components/charts/Gauge';
import { MuestrasChart } from '@/components/charts/MuestrasChart';
import { BarrasPorFilaChart } from '@/components/charts/BarrasPorFilaChart';
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
            <Cifra icono={FlaskConical} etiqueta="Resultados del laboratorio" valor={cantidad(r.resultados)} detalle={`${r.efluente} efluente · ${r.afluente} afluente`} />
            <Cifra icono={FileText} etiqueta="Informes PGC-025" valor={cantidad(r.informes)} detalle="Uno por camaronera" />
            <Cifra
              icono={TrendingUp} etiqueta="Superan el límite"
              valor={cantidad(r.conIncumplimiento)}
              detalle={r.efluente ? (r.conIncumplimiento ? 'Revisar resultados' : 'Todos cumplen') : 'Sin resultados'}
              estado={r.efluente ? (r.conIncumplimiento ? { tipo: 'alerta', icono: AlertTriangle } : { tipo: 'bien', icono: CheckCircle2 }) : undefined}
            />
            <Cifra
              icono={TestTube} etiqueta="pH del efluente"
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

/**
 * Ícono y color de cada parámetro químico (el color va en la variable --serie, con su tono para el tema oscuro).
 * Los parámetros agregados en Configuración usan el ícono y el color general.
 */
const ESTILO_PARAMETRO: Record<string, { icono: LucideIcon; color: string }> = {
  salinidad: { icono: Droplets, color: '[--serie:#0891b2] dark:[--serie:#06b6d4]' },
  ph: { icono: TestTube, color: '[--serie:#7c3aed] dark:[--serie:#8b5cf6]' },
  alcalinidad: { icono: Beaker, color: '[--serie:#059669] dark:[--serie:#10b981]' },
  fosfato: { icono: Atom, color: '[--serie:#a16207] dark:[--serie:#eab308]' },
  amonio: { icono: FlaskRound, color: '[--serie:#c026d3] dark:[--serie:#d946ef]' },
  nitrito: { icono: Hexagon, color: '[--serie:#0284c7] dark:[--serie:#0ea5e9]' },
  nitrato: { icono: Component, color: '[--serie:#4d7c0f] dark:[--serie:#84cc16]' },
  calcio: { icono: Bone, color: '[--serie:#b45309] dark:[--serie:#d97706]' },
  magnesio: { icono: Gem, color: '[--serie:#4f46e5] dark:[--serie:#6366f1]' },
  potasio: { icono: Zap, color: '[--serie:#0d9488] dark:[--serie:#14b8a6]' },
  // Suelo
  humedad: { icono: Droplets, color: '[--serie:#0891b2] dark:[--serie:#06b6d4]' },
  ph_seco: { icono: TestTube, color: '[--serie:#7c3aed] dark:[--serie:#8b5cf6]' },
  materia_organica: { icono: Leaf, color: '[--serie:#4d7c0f] dark:[--serie:#84cc16]' },
  // Grupos de fitoplancton
  diatomeas: { icono: Hexagon, color: '[--serie:#b45309] dark:[--serie:#d97706]' },
  cianofitas: { icono: Waves, color: '[--serie:#0891b2] dark:[--serie:#06b6d4]' },
  clorofitas: { icono: Leaf, color: '[--serie:#4d7c0f] dark:[--serie:#84cc16]' },
  dinoflagelados: { icono: Orbit, color: '[--serie:#7c3aed] dark:[--serie:#8b5cf6]' },
  otros_fito: { icono: Shapes, color: '[--serie:#4f46e5] dark:[--serie:#6366f1]' },
};
const ESTILO_GENERAL = { icono: FlaskConical, color: '' };
const ESTILO_AMARILLAS = { icono: Bug, color: '[--serie:#a16207] dark:[--serie:#eab308]' };
const ESTILO_VERDES = { icono: Bug, color: '[--serie:#059669] dark:[--serie:#10b981]' };
/** Vibrios (de agua, suelo o camarón): colonias amarillas en ocre y verdes en verde; lo demás, su estilo propio o el general */
const estiloDe = (clave: string) => ESTILO_PARAMETRO[clave] ?? (clave.endsWith('_amarillas') ? ESTILO_AMARILLAS : clave.endsWith('_verdes') ? ESTILO_VERDES : ESTILO_GENERAL);

/** Referencia fija del parámetro (la que depende de la salinidad no se puede dibujar como línea; los grados de patología no tienen) */
const refFija = (c: { min?: number; max?: number; factorSalinidad?: number; escala?: string }) => (c.factorSalinidad || c.escala ? {} : { min: c.min, max: c.max });

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
  // Química y fitoplancton se ven muestra por muestra: un gráfico por parámetro, con las piscinas en el eje X
  // Todos los análisis de laboratorio se ven muestra por muestra: un gráfico por parámetro, con las piscinas en el eje X
  const quimica = Boolean(r);
  // En química, con un parámetro elegido se ve solo su gráfico y su tabla; sin elegir, todos
  const solo = quimica && parametro ? (r?.campos.find((c) => c.clave === parametro) ?? null) : null;
  const columna = solo && r ? r.campos.indexOf(solo) : -1;
  const general = quimica && r?.nivel === 'muestra' && !solo;
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
          <select value={quimica ? (solo?.clave ?? '') : (p?.clave ?? '')} onChange={(e) => setParametro(e.target.value || null)} className={`max-w-64 ${SELECT}`}>
            {quimica && <option value="">Todos</option>}
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
            <Cifra icono={Microscope} etiqueta="Muestras analizadas" valor={cantidad(r.muestras)} detalle={r.ultima ? `Última: ${r.ultima}` : 'Sin muestras'} />
            {r.piscina ? (
              <Cifra icono={Waves} etiqueta="Piscina" valor={r.nombrePiscina ?? ''} detalle={centro ?? undefined} />
            ) : centro ? (
              <Cifra icono={Waves} etiqueta="Piscinas analizadas" valor={cantidad(r.cantidadPiscinas)} detalle={centro} />
            ) : (
              <Cifra icono={MapPin} etiqueta="Campamentos" valor={cantidad(r.campamentos)} detalle={`${miles(r.cantidadPiscinas)} piscinas`} />
            )}
            {r.valoresConRef > 0 && (
              <Cifra
                icono={Activity} etiqueta="Valores fuera de referencia"
                valor={cantidad(r.valoresFuera)}
                detalle={`de ${miles(r.valoresConRef)} valores con referencia`}
                estado={r.valoresFuera ? { tipo: 'alerta', icono: AlertTriangle } : { tipo: 'bien', icono: CheckCircle2 }}
              />
            )}
            {r.analisis.id === 'fresco' && hayMuestras && (
              <Cifra
                icono={Bug} etiqueta="Hallazgos en nivel alto o más"
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
          {/* Una piscina elegida y sin parámetro: un solo gráfico general con todos los parámetros de esa piscina */}
          {general && (
            <Grafico
              titulo={`Todos los parámetros de ${r.nombrePiscina} (${centro})`}
              nota="Una fila por parámetro y una columna por análisis (su fecha, abajo) · cada fila tiene su propia escala · línea punteada: referencia · rojo: fuera de la referencia · barra cortada con una raya: valor muy por encima del resto"
            >
              <BarrasPorFilaChart
                categorias={[...new Map(r.porParametro.flatMap((t) => t.items.map((i) => [i.analisis, i.label] as const)))]
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([key, label]) => ({ key, label }))}
                filas={r.porParametro.map((t) => {
                  const estilo = estiloDe(t.campo.clave);
                  const Icono = estilo.icono;
                  return {
                    key: t.campo.clave,
                    label: t.campo.etiqueta,
                    sub: [unidadDe(t.campo), referenciaDe(t.campo)].filter(Boolean).join(' · '),
                    clase: estilo.color,
                    icono: <Icono size={17} />,
                    min: refFija(t.campo).min,
                    max: refFija(t.campo).max,
                    tope: t.campo.escala === 'patologia' ? 4 : undefined,
                    puntos: t.items.map((i) => ({ categoria: i.analisis, valor: i.valor, titulo: i.titulo, detalle: i.detalle, fuera: i.fuera })),
                  };
                })}
                formato={valorTexto}
                formatoLargo={(v, fila) => `${valorTexto(v)} ${fila.sub?.split(' · ')[0] ?? ''}`.trim()}
              />
              {Object.keys(r.generos).length > 0 && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {r.porParametro
                    .filter((t) => r.generos[t.campo.clave])
                    .map((t) => (
                      <div key={t.campo.clave}>
                        <h5 className="text-xs font-semibold">Géneros de {t.campo.etiqueta.toLowerCase()} encontrados</h5>
                        <p className="mb-1 text-[11px] text-slate-500 dark:text-slate-400">Número de análisis en que apareció cada género</p>
                        <BarList items={r.generos[t.campo.clave]} formato={miles} formatoLargo={(v) => `${miles(v)} ${v === 1 ? 'análisis' : 'análisis'}`} />
                      </div>
                    ))}
                </div>
              )}
            </Grafico>
          )}
          {quimica && !general && (
            <Grafico
              titulo={
                solo
                  ? `${solo.etiqueta} ${nivel === 'muestra' ? `en ${r.nombrePiscina}, análisis por análisis` : `${r.analisis.seccion === 'agua' ? 'piscina por piscina' : 'muestra por muestra'} ${centro ? `en ${centro}` : 'en todos los campamentos'}`}`
                  : `Parámetros de ${r.analisis.nombre.toLowerCase()} ${centro ? `en ${centro}` : 'en todos los campamentos'}`
              }
              nota={
                solo
                  ? [
                      nivel === 'muestra' ? 'Eje X: la fecha de cada análisis' : `Eje X: las ${r.analisis.seccion === 'agua' ? 'piscinas' : 'muestras'} (una por análisis), con su campamento debajo`,
                      'eje Y: el valor del parámetro',
                      'línea punteada: referencia',
                      'rojo: fuera de la referencia',
                      'anillo en el borde: valor que se sale de la escala',
                      'si no caben, desliza el gráfico a los lados',
                    ].join(' · ')
                  : 'Toca un parámetro para ver su gráfico y su tabla'
              }
            >
              {!solo ? (
                // Sin parámetro elegido: solo las tarjetas (los gráficos se dibujan al elegir uno, para que la página no se ponga lenta)
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {r.porParametro.map((t) => {
                    const estilo = estiloDe(t.campo.clave);
                    const Icono = estilo.icono;
                    const fuera = t.items.filter((i) => i.fuera).length;
                    return (
                      <button
                        key={t.campo.clave}
                        type="button"
                        onClick={() => setParametro(t.campo.clave)}
                        className={`flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--serie,var(--chart-serie))] hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-slate-800 dark:bg-slate-900 ${estilo.color}`}
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: 'var(--serie, var(--chart-serie))' }} aria-hidden="true">
                          <Icono size={22} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{t.campo.etiqueta}</span>
                          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{[unidadDe(t.campo), referenciaDe(t.campo)].filter(Boolean).join(' · ') || 'Sin referencia'}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-600 dark:text-slate-300">
                            {miles(t.items.length)} {t.items.length === 1 ? 'muestra' : 'muestras'}
                          </span>
                          {fuera > 0 && <span className="block truncate text-[11px] font-semibold text-red-700 dark:text-red-400">▲ {miles(fuera)} fuera de referencia</span>}
                        </span>
                        <ChevronRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              ) : (
              <div className="flex flex-col gap-3">
                <button type="button" onClick={() => setParametro(null)} className="inline-flex items-center gap-1 self-start text-xs font-semibold text-brand-700 hover:underline dark:text-sky-300">
                  <ChevronLeft size={14} aria-hidden="true" /> Todos los parámetros
                </button>
                {r.porParametro
                  .filter((t) => t.campo.clave === solo.clave)
                  .map((t) => {
                  const u = unidadDe(t.campo);
                  const estilo = estiloDe(t.campo.clave);
                  const Icono = estilo.icono;
                  return (
                    <div key={t.campo.clave} className={`min-w-0 rounded-lg border border-slate-200 p-3 dark:border-slate-800 ${estilo.color}`}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: 'var(--serie, var(--chart-serie))' }} aria-hidden="true">
                          <Icono size={17} />
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-[13px] font-semibold">{t.campo.etiqueta}</h4>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {[u, referenciaDe(t.campo), `${t.items.length} ${t.items.length === 1 ? 'muestra' : 'muestras'}`].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                      <MuestrasChart
                        items={t.items}
                        formato={valorTexto}
                        formatoLargo={(v) => `${valorTexto(v)} ${u}`.trim()}
                        alto={280}
                        rango={t.rango}
                        min={refFija(t.campo).min}
                        max={refFija(t.campo).max}
                      />
                      {r.generos[t.campo.clave] && (
                        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                          <h5 className="text-xs font-semibold">Géneros de {t.campo.etiqueta.toLowerCase()} encontrados</h5>
                          <p className="mb-1 text-[11px] text-slate-500 dark:text-slate-400">Número de muestras en que apareció cada género</p>
                          <BarList items={r.generos[t.campo.clave]} formato={miles} formatoLargo={(v) => `${miles(v)} ${v === 1 ? 'muestra' : 'muestras'}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
            </Grafico>
          )}
          {r.hallazgos.length > 0 && (
            <Grafico titulo="Hallazgos por grado promedio" nota="Del más grave al más leve · toca un hallazgo para ver solo su gráfico">
              <BarList items={r.hallazgos} formato={valorTexto} formatoLargo={(v) => `Grado ${valorTexto(v)}`} seleccion={solo?.clave ?? null} onSelect={setParametro} />
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
              campos={solo ? [solo] : r.campos}
              filas={solo ? r.filas.map((fila) => ({ ...fila, celdas: [fila.celdas[columna]] })) : r.filas}
              parametro={quimica ? (solo?.clave ?? null) : p.clave}
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
            <Cifra icono={ClipboardCheck} etiqueta="Revisiones del check list" valor={cantidad(r.revisiones)} />
            <Cifra icono={Building2} etiqueta="Sucursales revisadas" valor={cantidad(r.sucursales)} />
            <Cifra
              icono={Percent} etiqueta="Cumplimiento promedio"
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
            <Cifra icono={CalendarDays} etiqueta="Fechas del año" valor={cantidad(r.total)} detalle={`${miles(r.auditorias)} ${r.auditorias === 1 ? 'auditoría' : 'auditorías'} ASC / BAP`} />
            <Cifra icono={CalendarClock} etiqueta="Próximas" valor={cantidad(r.proximos)} />
            <Cifra
              icono={CalendarX} etiqueta="Vencidas"
              valor={cantidad(r.vencidos)}
              detalle={r.vencidos ? 'Sin marcar como realizadas' : r.total ? 'Ninguna vencida' : undefined}
              estado={r.total ? (r.vencidos ? { tipo: 'alerta', icono: AlertTriangle } : { tipo: 'bien', icono: CheckCircle2 }) : undefined}
            />
            <Cifra icono={CalendarCheck} etiqueta="Realizadas" valor={cantidad(r.realizados)} />
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
            <Cifra icono={Wrench} etiqueta="Partes reparadas" valor={cantidad(r.partesReparadas)} />
            <Cifra icono={PiggyBank} etiqueta="Ahorro" valor={dineroCorto(r.ahorro)} detalle="Lo que no se gastó en partes nuevas" />
            <Cifra icono={Hammer} etiqueta="En reparación" valor={cantidad(r.enReparacion)} />
            <Cifra icono={Ban} etiqueta="No reparables" valor={cantidad(r.noReparables)} />
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

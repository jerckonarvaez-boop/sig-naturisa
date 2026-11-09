// Datos de los gráficos del Dashboard (funciones puras). Usan las mismas reglas de cada módulo para que las cifras
// coincidan con las de su sección.
import type { BarListItem } from '@/components/charts/BarList';
import type { BudgetBarItem } from '@/components/charts/BudgetBars';
import { MESES } from '@/constants/fechas';
import { TIPOS } from '@/modules/eventos/config';
import { agruparEventos } from '@/modules/eventos/logic/eventos';
import type { Evento } from '@/modules/eventos/types';
import { contar, cumplimiento } from '@/modules/inspecciones-sci/checklist/logic/calculo';
import type { Revision } from '@/modules/inspecciones-sci/checklist/types';
import type { DefinicionLaboratorio, InformeResumen, SeccionId } from '@/modules/laboratorios/analisis/types';
import { ahorroPorMes, anioDe, resumir } from '@/modules/laboratorios/oxigenometros/logic/ahorro';
import type { Reparacion } from '@/modules/laboratorios/oxigenometros/types';
import { evaluar, incumplimientos, numeroDe } from '@/modules/monitoreo-agua/logic/monitoreo';
import type { DefinicionMonitoreo, Resultado } from '@/modules/monitoreo-agua/types';
import { gastoPorArea, gastoPorMes, gastoPorSucursal } from '@/modules/presupuesto/logic/agregaciones';
import { AREA_GENERAL, areasDisponibles, filtrar, prepararRegistros, sumar, totalGasto } from '@/modules/presupuesto/logic/logica';
import type { Filtros, PresupuestoData } from '@/modules/presupuesto/types';
import { miles } from '@/utils/numeros';

const delAnio = (fecha: string | null | undefined, anio: number) => Boolean(fecha?.startsWith(String(anio)));

/** Conteo (o suma) por mes del año: 12 columnas, enero a diciembre */
function porMes<T>(lista: T[], fecha: (x: T) => string, valor: (x: T) => number = () => 1): BarListItem[] {
  return MESES.map((label, i) => ({
    key: String(i),
    label,
    valor: sumar(lista.filter((x) => Number(fecha(x).slice(5, 7)) - 1 === i), valor),
  }));
}

/** Conteo por una clave, de mayor a menor */
function contarPor<T>(lista: T[], clave: (x: T) => string): BarListItem[] {
  const mapa = new Map<string, number>();
  for (const x of lista) mapa.set(clave(x), (mapa.get(clave(x)) ?? 0) + 1);
  return [...mapa].sort((a, b) => b[1] - a[1]).map(([key, valor]) => ({ key, label: key, valor }));
}

/* ---------- Presupuesto ---------- */

export function resumenPresupuesto(data: PresupuestoData, anio: number) {
  const registros = prepararRegistros(data.gastos);
  const filtros: Filtros = { area: AREA_GENERAL, anio, sucursal: null, item: null, subarea: null, mes: null, busqueda: '' };
  const delAnioFiltrado = filtrar(registros, filtros);
  const porArea: BudgetBarItem[] = gastoPorArea(registros, filtros, areasDisponibles(data, registros), data).map((a) => ({
    key: a.key,
    label: a.label,
    gasto: a.valor,
    presupuesto: a.presupuesto ?? 0,
  }));
  return {
    gasto: totalGasto(delAnioFiltrado),
    presupuesto: sumar(data.presupuestoArea, (p) => p.monto),
    registros: delAnioFiltrado.length,
    porMes: gastoPorMes(registros, filtros),
    porArea,
    porSucursal: gastoPorSucursal(registros, filtros),
  };
}

/* ---------- Laboratorios de análisis ---------- */

export const NOMBRE_SECCION: Record<SeccionId, string> = { agua: 'Análisis de Agua', suelo: 'Análisis de Suelo', patologia: 'Patologías en fresco' };
const SECCION_CORTA: Record<SeccionId, string> = { agua: 'Agua', suelo: 'Suelo', patologia: 'Patología' };
const SIN_CENTRO = 'Sin centro de costo';

/** Filtros del gráfico de laboratorio (null = todos) */
export interface FiltrosLaboratorio {
  seccion: SeccionId | null;
  /** Análisis específico, "seccion:tipo" (ej. agua:fitoplancton) */
  analisis: string | null;
  centro: string | null;
}

export const SIN_FILTROS_LAB: FiltrosLaboratorio = { seccion: null, analisis: null, centro: null };

/** Análisis que lleva un informe ("a+b+c" en las secciones combinables), como claves "seccion:tipo" */
const analisisDe = (i: InformeResumen) => i.tipo.split('+').filter(Boolean).map((t) => `${i.seccion}:${t}`);
const centroDe = (i: InformeResumen) => i.sucursal.trim() || SIN_CENTRO;

/** Días entre la toma de la muestra y la emisión del informe (null si falta una fecha o no cuadran) */
function diasEntrega(i: InformeResumen): number | null {
  const a = Date.parse(i.fechaMuestra);
  const b = Date.parse(i.fechaEmision);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round((b - a) / 864e5);
}

export function resumenLaboratorio(informes: InformeResumen[], def: DefinicionLaboratorio, anio: number, f: FiltrosLaboratorio) {
  const nombreAnalisis = (clave: string, conSeccion: boolean) => {
    const [s, t] = clave.split(':') as [SeccionId, string];
    const tipo = def.secciones[s]?.tipos.find((x) => x.id === t);
    // "Análisis de materia orgánica" → "Materia orgánica"; si el corto repite la sección ("Patología"), el nombre completo
    const completo = (tipo?.nombre ?? t).replace(/^an[aá]lisis de /i, '');
    const nombre = tipo?.corto && tipo.corto !== SECCION_CORTA[s] ? tipo.corto : completo.charAt(0).toUpperCase() + completo.slice(1);
    return conSeccion && !nombre.startsWith(SECCION_CORTA[s]) ? `${SECCION_CORTA[s] ?? s} · ${nombre}` : nombre;
  };

  const delAnioLista = informes.filter((i) => delAnio(i.fechaEmision, anio));
  // Centros con informes en el año (para el selector), según el tipo de análisis elegido
  const centros = [...new Set(delAnioLista.filter((i) => !f.seccion || i.seccion === f.seccion).map(centroDe))].sort((a, b) => a.localeCompare(b, 'es'));
  const lista = delAnioLista.filter(
    (i) => (!f.seccion || i.seccion === f.seccion) && (!f.analisis || analisisDe(i).includes(f.analisis)) && (!f.centro || centroDe(i) === f.centro),
  );
  // Para el gráfico de análisis no se aplica el filtro de análisis (así se ve con cuál se compara)
  const paraAnalisis = delAnioLista.filter((i) => (!f.seccion || i.seccion === f.seccion) && (!f.centro || centroDe(i) === f.centro));
  // Y para el de centros, no el de centro
  const paraCentros = delAnioLista.filter((i) => (!f.seccion || i.seccion === f.seccion) && (!f.analisis || analisisDe(i).includes(f.analisis)));

  const muestrasDe = (l: InformeResumen[]) => sumar(l, (i) => i.muestras.length);
  const muestrasTxt = (n: number) => `${miles(n)} ${n === 1 ? 'muestra' : 'muestras'}`;

  // Análisis en el orden de la definición (agua, suelo, patología y sus tipos)
  const claves = (Object.keys(NOMBRE_SECCION) as SeccionId[])
    .filter((s) => !f.seccion || s === f.seccion)
    .flatMap((s) => (def.secciones[s]?.tipos ?? []).map((t) => `${s}:${t.id}`));
  for (const i of paraAnalisis) for (const c of analisisDe(i)) if (!claves.includes(c)) claves.push(c);
  const conSeccion = !f.seccion;

  const porAnalisis: BarListItem[] = claves
    .map((c) => {
      const l = paraAnalisis.filter((i) => analisisDe(i).includes(c));
      return { key: c, label: nombreAnalisis(c, conSeccion), valor: l.length, detalle: muestrasTxt(muestrasDe(l)) };
    })
    .sort((a, b) => b.valor - a.valor);

  const grupos = new Map<string, InformeResumen[]>();
  for (const i of paraCentros) grupos.set(centroDe(i), [...(grupos.get(centroDe(i)) ?? []), i]);
  const porCentro: BarListItem[] = [...grupos]
    .map(([c, l]) => {
      const partes = (Object.keys(SECCION_CORTA) as SeccionId[])
        .map((s) => [s, l.filter((i) => i.seccion === s).length] as const)
        .filter(([, n]) => n)
        .map(([s, n]) => `${SECCION_CORTA[s]} ${n}`);
      return { key: c, label: c, valor: l.length, detalle: [muestrasTxt(muestrasDe(l)), ...(conSeccion ? partes : [])].join(' · ') };
    })
    .sort((a, b) => b.valor - a.valor || a.label.localeCompare(b.label, 'es'));

  // Cruce centro de costo × análisis (informes que incluyen cada análisis), con los filtros aplicados
  const columnas = claves.filter((c) => lista.some((i) => analisisDe(i).includes(c)));
  const filasCruce = [...new Set(lista.map(centroDe))]
    .map((centro) => {
      const l = lista.filter((i) => centroDe(i) === centro);
      return { centro, total: l.length, celdas: columnas.map((c) => l.filter((i) => analisisDe(i).includes(c)).length) };
    })
    .sort((a, b) => b.total - a.total || a.centro.localeCompare(b.centro, 'es'));

  const muestrasMes = porMes(lista, (i) => i.fechaEmision, (i) => i.muestras.length);
  const dias = lista.map(diasEntrega).filter((d): d is number => d !== null);

  return {
    informes: lista.length,
    muestras: muestrasDe(lista),
    centrosAtendidos: new Set(lista.map(centroDe)).size,
    diasEntrega: dias.length ? sumar(dias, (d) => d) / dias.length : null,
    centros,
    // El detalle (para el tooltip) son las muestras del mes
    porMes: porMes(lista, (i) => i.fechaEmision).map((m, n) => ({ ...m, detalle: muestrasTxt(muestrasMes[n].valor) })),
    porAnalisis,
    porCentro,
    // En la tabla, el análisis va sin la sección: la sección encabeza su grupo de columnas
    cruce: {
      columnas: columnas.map((c) => {
        const s = c.split(':')[0] as SeccionId;
        return { key: c, label: nombreAnalisis(c, false), grupo: SECCION_CORTA[s] ?? s };
      }),
      filas: filasCruce,
    },
    nombreAnalisis: (c: string) => nombreAnalisis(c, true),
  };
}

/* ---------- Oxigenómetros ---------- */

export function resumenOxigenometros(reparaciones: Reparacion[], anio: number) {
  const lista = reparaciones.filter((r) => anioDe(r) === anio);
  return { ...resumir(lista), reparaciones: lista.length, porMes: ahorroPorMes(lista) };
}

/* ---------- Monitoreo de agua ---------- */

/** Un parámetro del efluente: el valor más alto del año frente a su límite máximo permisible */
export interface FilaLimite {
  clave: string;
  nombre: string;
  unidad: string;
  limite: string;
  maximo: number;
  /** maximo / límite (1 = en el límite) */
  fraccion: number;
  supera: boolean;
  resultados: number;
}

export function resumenMonitoreo(resultados: Resultado[], def: DefinicionMonitoreo, anio: number) {
  const lista = resultados.filter((r) => delAnio(r.fechaMuestreo, anio));
  const efluente = lista.filter((r) => r.punto === 'efluente');
  const conIncumplimiento = efluente.filter((r) => incumplimientos(r, def).length > 0);

  // Solo parámetros con límite máximo y sin mínimo: el pH (rango 6–9) se informa aparte
  const parametros: FilaLimite[] = [];
  for (const p of def.parametros) {
    if (p.max === undefined || p.min !== undefined) continue;
    const valores = efluente.flatMap((r) => r.valores.filter((v) => v.clave === p.clave && v.valor.trim()));
    const numeros = valores.map((v) => numeroDe(v.valor)).filter((n): n is number => n !== null);
    if (!numeros.length) continue;
    const maximo = Math.max(...numeros);
    parametros.push({
      clave: p.clave,
      nombre: p.nombre,
      unidad: p.unidad,
      limite: p.limite,
      maximo,
      fraccion: maximo / p.max,
      supera: valores.some((v) => evaluar(p, v.valor) === 'no-cumple'),
      resultados: numeros.length,
    });
  }
  parametros.sort((a, b) => b.fraccion - a.fraccion);

  const ph = def.parametros.find((p) => p.clave === 'ph');
  const valoresPh = efluente
    .flatMap((r) => r.valores.filter((v) => v.clave === 'ph'))
    .map((v) => numeroDe(v.valor))
    .filter((n): n is number => n !== null);

  return {
    resultados: lista.length,
    efluente: efluente.length,
    afluente: lista.length - efluente.length,
    informes: sumar(efluente, (r) => r.sitios.length),
    conIncumplimiento: conIncumplimiento.length,
    parametros,
    ph: valoresPh.length && ph ? { min: Math.min(...valoresPh), max: Math.max(...valoresPh), limite: ph.limite } : null,
    porMes: porMes(lista, (r) => r.fechaMuestreo),
  };
}

/* ---------- Inspecciones SCI ---------- */

export function resumenInspecciones(revisiones: Revision[], anio: number) {
  const lista = revisiones.filter((r) => delAnio(r.fecha, anio));
  // Última revisión de cada sucursal en el año
  const ultimas = new Map<string, Revision>();
  for (const r of [...lista].sort((a, b) => a.fecha.localeCompare(b.fecha))) ultimas.set(r.sucursal, r);
  const porSucursal: BarListItem[] = [...ultimas]
    .map(([sucursal, r]) => {
      const c = contar(r.respuestas.map((x) => x.respuesta));
      return { key: sucursal, label: sucursal, valor: cumplimiento(c) ?? 0, detalle: `${miles(c.si)} cumplen · ${miles(c.no)} no cumplen · ${r.fecha}` };
    })
    .sort((a, b) => a.valor - b.valor);
  const fracciones = porSucursal.map((s) => s.valor);
  return {
    revisiones: lista.length,
    sucursales: ultimas.size,
    promedio: fracciones.length ? sumar(fracciones, (f) => f) / fracciones.length : null,
    porSucursal,
  };
}

/* ---------- Calendario y auditorías ---------- */

export function resumenCalendario(eventos: Evento[], anio: number) {
  const lista = eventos.filter((e) => delAnio(e.fechaInicio, anio));
  const grupos = agruparEventos(lista);
  return {
    total: lista.length,
    proximos: grupos.proximos.length,
    vencidos: grupos.vencidos.length,
    realizados: grupos.realizados.length,
    auditorias: lista.filter((e) => e.tipo === 'auditoria-asc' || e.tipo === 'auditoria-bap').length,
    porMes: porMes(lista, (e) => e.fechaInicio),
    porTipo: contarPor(lista, (e) => TIPOS[e.tipo].label),
  };
}

/** Años con datos en alguna sección (más el actual), del más reciente al más antiguo */
export function aniosConDatos(fechas: (string | null | undefined)[]): number[] {
  const anios = new Set([new Date().getFullYear()]);
  for (const f of fechas) if (f && /^\d{4}/.test(f)) anios.add(Number(f.slice(0, 4)));
  return [...anios].sort((a, b) => b - a);
}

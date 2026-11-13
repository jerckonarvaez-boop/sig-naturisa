// Resultados de los laboratorios de análisis para el Dashboard (funciones puras): valores de cada muestra por
// campamento (centro de costo), por mes y frente a su referencia, con las mismas reglas del módulo de laboratorio.
import type { BarListItem } from '@/components/charts/BarList';
import { MESES } from '@/constants/fechas';
import { camposVisibles, estadoReferencia, nivelPatologia, NIVELES_PATOLOGIA, type EstadoReferencia } from '@/modules/laboratorios/analisis/logic/laboratorio';
import type { CampoLab, DefinicionLaboratorio, Informe, SeccionId, ValorLab } from '@/modules/laboratorios/analisis/types';

/** Análisis que se pueden revisar: qué grupos de campos de qué sección muestra cada uno */
export interface AnalisisLab {
  id: string;
  nombre: string;
  seccion: SeccionId;
  grupos: string[];
}

export const ANALISIS_LAB: AnalisisLab[] = [
  { id: 'fitoplancton', nombre: 'Fitoplancton', seccion: 'agua', grupos: ['fitoplancton'] },
  { id: 'quimica', nombre: 'Química del agua', seccion: 'agua', grupos: ['basicos', 'quimica'] },
  { id: 'vibrios', nombre: 'Vibrios en agua', seccion: 'agua', grupos: ['bacteriologia'] },
  { id: 'suelo', nombre: 'Suelo', seccion: 'suelo', grupos: ['suelo'] },
  { id: 'vibrios-suelo', nombre: 'Vibrios en suelo', seccion: 'suelo', grupos: ['bacteriologia'] },
  { id: 'fresco', nombre: 'Patología en fresco', seccion: 'patologia', grupos: ['fresco'] },
  { id: 'bacteriologia', nombre: 'Bacteriología en camarón', seccion: 'patologia', grupos: ['bacteriologia'] },
];

const SIN_CENTRO = 'Sin centro de costo';

/** Una muestra con sus datos de origen */
interface Muestra {
  centro: string;
  fecha: string;
  codigo: string;
  nombre: string;
  valores: Record<string, ValorLab>;
}

const numeroDe = (v: ValorLab | undefined): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const promedio = (l: number[]) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);

/** Fecha del resultado: la de la muestra y, si falta, la de emisión */
const fechaDe = (i: Informe) => (/^\d{4}-\d{2}-\d{2}/.test(i.fechaMuestra) ? i.fechaMuestra : i.fechaEmision);

/** Número legible: más decimales cuanto más pequeño (pH 8,58 · amonio 0,12 · 930.000 UFC) */
export function valorTexto(n: number | null): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const dec = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return n.toLocaleString('es-EC', { maximumFractionDigits: dec, minimumFractionDigits: 0 });
}

/** Unidad para mostrar junto al nombre (los conteos de fitoplancton van en miles de células por ml) */
export const unidadDe = (c: CampoLab) => c.unidad ?? (c.grupo === 'fitoplancton' ? 'cel/ml (000)' : c.escala === 'patologia' ? 'grado 0–4' : '');

/** Cómo se lee la referencia del parámetro, en corto */
export function referenciaDe(c: CampoLab): string {
  if (c.escala === 'patologia') return '0 ausencia · 4 muy alto';
  if (c.factorSalinidad) return `ref. ${String(c.factorSalinidad).replace('.', ',')} × salinidad`;
  if (c.min != null && c.max != null) return `ref. ${valorTexto(c.min)} – ${valorTexto(c.max)}`;
  if (c.max != null) return `ref. máx. ${valorTexto(c.max)}`;
  return '';
}

/** El parámetro tiene una referencia con la que comparar cada valor */
export const tieneReferencia = (c: CampoLab) => !c.escala && (c.factorSalinidad != null || c.min != null || c.max != null);

/** Distancia de edición ≤ 1 (para unir "Nitzchia" con "Nitzschia") */
function casiIgual(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i);
}

/** Celda de la tabla: promedio (o valor) y cuántas muestras quedan fuera de la referencia */
export interface Celda {
  valor: number | null;
  n: number;
  minimo: number | null;
  maximo: number | null;
  /** Muestras sobre / bajo la referencia */
  altos: number;
  bajos: number;
  /** Estado de un valor único (vista por muestra) */
  estado: EstadoReferencia | null;
}

export interface FilaTabla {
  key: string;
  label: string;
  sub?: string;
  celdas: Celda[];
}

export interface FiltrosResultados {
  analisis: string;
  centro: string | null;
  /** Piscina elegida (clave de clavePiscina): se ve su historial, análisis por análisis */
  piscina: string | null;
  /** Sin campamento elegido: filas por campamento o por piscina (de todos los campamentos) */
  agrupar: 'campamento' | 'piscina';
  parametro: string | null;
  /** Meses que se analizan (0 = enero … 11 = diciembre); sin indicar, todo el año */
  mesDesde?: number;
  mesHasta?: number;
  /** Orden de las muestras en el gráfico "muestra por muestra": por fecha de análisis o juntando las de cada piscina */
  orden?: 'fecha' | 'piscina';
}

/** Cómo se agrupan las filas: por campamento, por piscina o cada análisis de una piscina */
export type NivelResultados = 'campamento' | 'piscina' | 'muestra';

/** La misma piscina escrita de distintas formas ("PS-35", "ps-35", "PS -35") es una sola */
export const clavePiscina = (nombre: string) => nombre.trim().toUpperCase().replace(/\s+/g, '');
const fechaCortaNum = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export function resumenResultados(informes: Informe[], def: DefinicionLaboratorio, anio: number, f: FiltrosResultados) {
  const analisis = ANALISIS_LAB.find((a) => a.id === f.analisis) ?? ANALISIS_LAB[0];
  const seccion = def.secciones[analisis.seccion];

  // Muestras del año, por análisis (una muestra entra si tiene algún valor de ese análisis)
  const enMeses = (fecha: string) => {
    const mes = Number(fecha.slice(5, 7)) - 1;
    return mes >= (f.mesDesde ?? 0) && mes <= (f.mesHasta ?? 11);
  };
  const delAnio = informes.filter((i) => fechaDe(i).startsWith(String(anio)) && enMeses(fechaDe(i)));
  const muestrasDe = (a: AnalisisLab): Muestra[] => {
    const cs = (def.secciones[a.seccion]?.campos ?? []).filter((c) => c.tipo === 'numero' && a.grupos.includes(c.grupo));
    return delAnio
      .filter((i) => i.seccion === a.seccion)
      .flatMap((i) =>
        i.muestras.map((m) => ({ centro: i.sucursal.trim() || SIN_CENTRO, fecha: fechaDe(i), codigo: i.codigo, nombre: m.nombre, valores: m.valores })),
      )
      .filter((m) => cs.some((c) => numeroDe(m.valores[c.clave]) != null));
  };
  const disponibles = Object.fromEntries(ANALISIS_LAB.map((a) => [a.id, muestrasDe(a).length])) as Record<string, number>;

  const todas = muestrasDe(analisis);
  // Parámetros del análisis; los quitados en Configuración, solo si tienen valores en el año
  const campos = camposVisibles(
    (seccion?.campos ?? []).filter((c) => c.tipo === 'numero' && analisis.grupos.includes(c.grupo)),
    todas,
  );
  const centros = [...new Set(todas.map((m) => m.centro))].sort((a, b) => a.localeCompare(b, 'es'));
  const delCentro = todas.filter((m) => !f.centro || m.centro === f.centro);
  // Nombre de cada piscina: la forma en mayúsculas si existe (son códigos, ej. PS-35); si no, la que más se escribió
  const formas = new Map<string, Map<string, number>>();
  for (const m of todas) {
    const k = `${m.centro}|${clavePiscina(m.nombre)}`;
    const conteo = formas.get(k) ?? new Map<string, number>();
    conteo.set(m.nombre.trim(), (conteo.get(m.nombre.trim()) ?? 0) + 1);
    formas.set(k, conteo);
  }
  const nombreDe = (centro: string, nombre: string) => {
    const conteo = formas.get(`${centro}|${clavePiscina(nombre)}`);
    if (!conteo) return nombre.trim();
    const mayus = (t: string) => Number(t === t.toUpperCase());
    return [...conteo].sort((a, b) => mayus(b[0]) - mayus(a[0]) || b[1] - a[1])[0][0];
  };
  // Piscinas del campamento elegido (para el selector)
  const nombresPiscina = new Map<string, string>();
  for (const m of delCentro) if (!nombresPiscina.has(clavePiscina(m.nombre))) nombresPiscina.set(clavePiscina(m.nombre), nombreDe(m.centro, m.nombre));
  const piscinas = f.centro
    ? [...nombresPiscina].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true }))
    : [];
  const piscina = f.centro && f.piscina && nombresPiscina.has(f.piscina) ? f.piscina : null;
  const muestras = delCentro
    .filter((m) => !piscina || clavePiscina(m.nombre) === piscina)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
  const nivel: NivelResultados = piscina ? 'muestra' : f.centro || f.agrupar === 'piscina' ? 'piscina' : 'campamento';

  const estadoDe = (c: CampoLab, m: Muestra) => estadoReferencia(c, numeroDe(m.valores[c.clave]), numeroDe(m.valores.salinidad));

  const celda = (c: CampoLab, l: Muestra[]): Celda => {
    const nums = l.map((m) => numeroDe(m.valores[c.clave])).filter((n): n is number => n != null);
    const estados = l.map((m) => estadoDe(c, m));
    return {
      valor: promedio(nums),
      n: nums.length,
      minimo: nums.length ? Math.min(...nums) : null,
      maximo: nums.length ? Math.max(...nums) : null,
      altos: estados.filter((e) => e === 'alto').length,
      bajos: estados.filter((e) => e === 'bajo').length,
      estado: l.length === 1 ? estados[0] : null,
    };
  };

  const nMuestras = (n: number) => `${n} ${n === 1 ? 'muestra' : 'muestras'}`;
  const porCentro = new Map<string, Muestra[]>();
  for (const m of muestras) porCentro.set(m.centro, [...(porCentro.get(m.centro) ?? []), m]);
  // Piscinas: la misma piscina en distintos campamentos son piscinas distintas
  const porPiscina = new Map<string, Muestra[]>();
  for (const m of muestras) {
    const k = `${m.centro}|${clavePiscina(m.nombre)}`;
    porPiscina.set(k, [...(porPiscina.get(k) ?? []), m]);
  }

  // Tabla: una fila por campamento, por piscina o (con una piscina elegida) por cada análisis de esa piscina
  const filas: FilaTabla[] =
    nivel === 'muestra'
      ? muestras.map((m, i) => ({ key: `${m.codigo}-${i}`, label: m.fecha, sub: `${nombreDe(m.centro, m.nombre)} · ${m.codigo}`, celdas: campos.map((c) => celda(c, [m])) }))
      : nivel === 'piscina'
        ? [...porPiscina]
            .sort((a, b) => a[0].localeCompare(b[0], 'es', { numeric: true }))
            .map(([key, l]) => ({
              key,
              label: nombreDe(l[0].centro, l[0].nombre),
              sub: f.centro ? `${nMuestras(l.length)} · última ${l[0].fecha}` : `${l[0].centro} · ${nMuestras(l.length)}`,
              celdas: campos.map((c) => celda(c, l)),
            }))
        : [...porCentro]
            .sort((a, b) => a[0].localeCompare(b[0], 'es'))
            .map(([centro, l]) => ({ key: centro, label: centro, sub: nMuestras(l.length), celdas: campos.map((c) => celda(c, l)) }));

  // Parámetro elegido para los gráficos
  const parametro = campos.find((c) => c.clave === f.parametro) ?? campos[0] ?? null;
  const detalleCelda = (c: CampoLab, x: Celda) => {
    const partes = [`${x.n} ${x.n === 1 ? 'muestra' : 'muestras'}`];
    if (x.n > 1 && x.minimo != null) partes.push(`mín. ${valorTexto(x.minimo)} · máx. ${valorTexto(x.maximo)}`);
    if (x.altos) partes.push(`▲ ${x.altos} sobre la referencia`);
    if (x.bajos) partes.push(`▼ ${x.bajos} bajo la referencia`);
    if (c.escala === 'patologia' && x.valor != null) partes.push(`nivel ${NIVELES_PATOLOGIA[nivelPatologia(x.valor)].label.toLowerCase()}`);
    return partes.join(' · ');
  };

  const barras: BarListItem[] = parametro
    ? filas
        .map((fila) => {
          const x = fila.celdas[campos.indexOf(parametro)];
          const label = nivel === 'piscina' && !f.centro ? `${fila.label} · ${fila.sub?.split(' · ')[0]}` : fila.label;
          return { key: fila.key, label, valor: x.valor ?? 0, detalle: [fila.sub, detalleCelda(parametro, x)].filter(Boolean).join(' · '), n: x.n };
        })
        .filter((b) => b.n > 0)
        .sort((a, b) => b.valor - a.valor)
        .map(({ n: _n, ...b }) => b)
    : [];

  const porMes = parametro
    ? MESES.map((label, i) => {
        const l = muestras.filter((m) => Number(m.fecha.slice(5, 7)) - 1 === i);
        const x = celda(parametro, l);
        return { key: String(i), label, valor: x.valor ?? 0, detalle: x.n ? detalleCelda(parametro, x) : 'Sin muestras' };
      })
    : [];

  // Historial de una piscina: el parámetro en cada análisis, del más antiguo al más reciente
  const porFecha =
    nivel === 'muestra' && parametro
      ? [...muestras].reverse().map((m, i) => {
          const x = celda(parametro, [m]);
          return { key: `${m.codigo}-${i}`, label: fechaCortaNum(m.fecha), valor: x.valor ?? 0, detalle: `${m.fecha} · ${m.codigo}${x.estado ? (x.estado === 'alto' ? ' · ▲ sobre la referencia' : ' · ▼ bajo la referencia') : ''}` };
        })
      : [];

  // Química, parámetro por parámetro: cada muestra ocupa un lugar en el eje X, rotulada con su piscina (o su fecha)
  // y agrupada por fecha (o por piscina); el valor va en el eje Y
  const porPiscinaOrden = nivel !== 'muestra' && f.orden === 'piscina';
  const numerico = (a: string, b: string) => a.localeCompare(b, 'es', { numeric: true });
  const ordenadas = [...muestras].sort((a, b) =>
    porPiscinaOrden
      ? numerico(a.centro, b.centro) || numerico(clavePiscina(a.nombre), clavePiscina(b.nombre)) || a.fecha.localeCompare(b.fecha)
      : a.fecha.localeCompare(b.fecha) || numerico(a.centro, b.centro) || numerico(a.nombre, b.nombre),
  );
  // Escala de cada parámetro: deja fuera el 2 % más alto y más bajo, para que un valor disparado no aplaste el resto
  const rangoDe = (v: number[]): [number, number] | undefined => {
    const o = [...v].sort((a, b) => a - b);
    if (!o.length) return undefined;
    return o.length < 20 ? [o[0], o[o.length - 1]] : [o[Math.floor(o.length * 0.02)], o[Math.ceil(o.length * 0.98) - 1]];
  };
  const porParametro = campos
    .map((c) => {
      const items = ordenadas
        .filter((m) => numeroDe(m.valores[c.clave]) != null)
        .map((m, i) => {
          const estado = estadoDe(c, m);
          const nombre = nombreDe(m.centro, m.nombre);
          const conCentro = f.centro ? nombre : `${nombre} · ${m.centro}`;
          return {
            key: `${m.codigo}-${m.nombre}-${i}`,
            label: nivel === 'muestra' || porPiscinaOrden ? fechaCortaNum(m.fecha) : nombre,
            grupo: nivel === 'muestra' ? '' : porPiscinaOrden ? conCentro : fechaCortaNum(m.fecha),
            valor: numeroDe(m.valores[c.clave]) ?? 0,
            titulo: `${conCentro} · ${m.fecha}`,
            detalle: `${m.codigo}${estado ? (estado === 'alto' ? ' · ▲ sobre la referencia' : ' · ▼ bajo la referencia') : ''}`,
            fuera: Boolean(estado),
          };
        });
      return { campo: c, items, rango: rangoDe(items.map((i) => i.valor)) };
    })
    .filter((t) => t.items.length > 0);

  // Géneros de fitoplancton: en cuántas muestras aparece cada uno
  const generos: BarListItem[] = [];
  if (analisis.id === 'fitoplancton' && seccion) {
    for (const campo of seccion.campos.filter((c) => c.grupo === 'fitoplancton' && c.opciones?.length)) {
      const grupo = seccion.campos.find((c) => c.clave === campo.junto)?.etiqueta ?? campo.etiqueta;
      for (const genero of campo.opciones!) {
        const con = muestras.filter((m) =>
          String(m.valores[campo.clave] ?? '')
            .split(/[\s,;]+/)
            .some((t) => t && casiIgual(t.toLowerCase(), genero.toLowerCase())),
        );
        if (!con.length) continue;
        const enCentros = [...new Set(con.map((m) => m.centro))];
        generos.push({
          key: `${campo.clave}:${genero}`,
          label: `${genero} · ${grupo.toLowerCase()}`,
          valor: con.length / muestras.length,
          detalle: `En ${con.length} de ${muestras.length} muestras${f.centro ? '' : ` · ${enCentros.length === 1 ? enCentros[0] : `${enCentros.length} campamentos`}`}`,
        });
      }
    }
    generos.sort((a, b) => b.valor - a.valor);
  }

  // Patología en fresco: cada hallazgo con su grado promedio, del más grave al más leve
  const hallazgos: BarListItem[] = campos.every((c) => c.escala === 'patologia')
    ? campos
        .map((c) => ({ c, x: celda(c, muestras) }))
        .filter(({ x }) => x.n > 0)
        .map(({ c, x }) => ({ key: c.clave, label: c.etiqueta, valor: x.valor ?? 0, detalle: detalleCelda(c, x) }))
        .sort((a, b) => b.valor - a.valor)
    : [];

  // Cifras
  let valoresFuera = 0;
  let valoresConRef = 0;
  let nivelesAltos = 0;
  for (const m of muestras)
    for (const c of campos) {
      if (numeroDe(m.valores[c.clave]) == null) continue;
      if (c.escala === 'patologia' && (numeroDe(m.valores[c.clave]) ?? 0) >= 2) nivelesAltos++;
      if (!tieneReferencia(c)) continue;
      valoresConRef++;
      if (estadoDe(c, m)) valoresFuera++;
    }

  return {
    analisis,
    campos,
    disponibles,
    centros,
    muestras: muestras.length,
    campamentos: porCentro.size,
    nivel,
    piscinas,
    piscina,
    nombrePiscina: piscina ? (nombresPiscina.get(piscina) ?? piscina) : null,
    cantidadPiscinas: porPiscina.size,
    porFecha,
    porParametro,
    ultima: muestras[0]?.fecha ?? null,
    valoresFuera,
    valoresConRef,
    nivelesAltos,
    parametro,
    barras,
    porMes,
    filas,
    generos,
    hallazgos,
    conReferencia: campos.some(tieneReferencia),
  };
}

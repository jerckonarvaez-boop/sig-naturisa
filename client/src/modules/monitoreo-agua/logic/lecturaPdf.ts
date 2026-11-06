// Lectura del informe del laboratorio (PDF de ELICROM o LAB-PSI): código, fechas, punto de muestreo, coordenadas y
// valores de los parámetros. Trabaja sobre el texto del PDF; lo leído se revisa en el formulario antes de guardar.
import type { PuntoMonitoreo } from '../meta';
import type { Resultado, ResultadoDatos, Sitio, ValorParametro } from '../types';

export interface LecturaPdf {
  laboratorio: string;
  codigo: string;
  fechaMuestreo: string;
  fechaEmision: string;
  /** Punto de muestreo como lo escribe el laboratorio ("Camaronera-Drenaje Ps 1") */
  locacion: string;
  norte: string;
  este: string;
  metodo: string;
  muestreoTercero: boolean;
  /** Valores en el orden del informe, con coma decimal como en los informes PGC-025 */
  valores: ValorParametro[];
}

/** Mayúsculas, sin tildes y con un solo espacio: así se buscan los nombres de los parámetros */
const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Nombres con que los laboratorios escriben cada parámetro (ya normalizados; son expresiones regulares) */
const NOMBRES: [clave: string, nombre: string][] = [
  ['dbo5', 'DEMANDA BIOQUIMICA DE OXIGENO'],
  ['dqo', 'DEMANDA QUIMICA DE OXIGENO'],
  ['sulfuros', 'SULFUROS?'],
  ['sst', 'SOLIDOS SUSPENDIDOS TOTALES'],
  ['ph', '(?<!U )(?<!U DE )(?:PH|POTENCIAL DE HIDROGENO)'],
  ['nitrogeno_total', 'NITROGENO TOTAL'],
  ['fosforo_total', 'FOSFORO TOTAL'],
  ['coliformes_fecales', 'COLIFORMES FECALES'],
  ['aceites_grasas', 'ACEITES Y GRASAS'],
  ['tph', 'HIDROCARBUROS TOTALES DE PETROLEO'],
  ['tensoactivos', 'TENSOACTIVOS'],
  ['cloro_total', 'CLORO TOTAL'],
  ['oxigeno_disuelto', 'OXIGENO DISUELTO'],
  ['material_flotante', 'MATERIAL FLOTANTE'],
  ['temperatura', 'TEMPERATURA'],
  ['arsenico', 'ARSENICO(?: TOTAL)?'],
  ['aluminio', 'ALUMINIO'],
  ['cianuro', 'CIANURO(?: TOTAL)?'],
  ['cinc', '(?:CINC|ZINC)'],
  ['cobre', 'COBRE'],
  ['cobalto', 'COBALTO'],
  ['cromo_hexavalente', 'CROMO HEXAVALENTE'],
  ['fenoles', '(?:COMPUESTOS FENOLICOS|FENOLES)'],
  ['mercurio', 'MERCURIO(?: TOTAL)?'],
  ['organoclorados', 'COMPUESTOS ORGANOCLORADOS'],
  ['organofosforados', 'COMPUESTOS ORGANOFOSFORADOS'],
  ['carbamatos', 'CARBAMATOS'],
  ['color', 'COLOR(?: REAL| VERDADERO| APARENTE)?'],
];

const ES_NUMERO = /^[<>]?\d+(?:[.,]\d+)?$/;
/** "N/D", "ND", "N.D." = No Detectado (el laboratorio no lo detectó: está bajo el límite de cuantificación) */
const NO_DETECTADO = /^N\.?\/?D\.?$/;

/** "0.069" → "0,069" · "<0.27" → "<0,27" · "AUSEN" → "AUSENCIA" · "N/D" → "N/D" */
function valorDe(token: string): string | null {
  if (ES_NUMERO.test(token)) return token.replace('.', ',');
  if (/^AUSEN/.test(token)) return 'AUSENCIA';
  if (NO_DETECTADO.test(token)) return 'N/D';
  if (/^PRESEN/.test(token)) return 'PRESENCIA';
  return null;
}

/**
 * Valor tras el nombre del parámetro. ELICROM: "SULFUROS 1,2 0.069 0.069 …" (notas de acreditación, lectura y
 * resultado; se toma la lectura, como en los informes PGC-025). LAB-PSI: "NITROGENO TOTAL MG/L 0,21 0,18 …" (unidad,
 * resultado e incertidumbre).
 */
function valorTras(resto: string, elicrom: boolean): string | null {
  const t = resto.split(' ').slice(0, 6);
  if (elicrom) {
    // Notas "1,2" · "2,5" · "1,2,8"; una nota sola ("3") solo si no es la lectura repetida ("8 8")
    if (/^[1-9](?:,[1-9])+$/.test(t[0]) || (/^[1-9]$/.test(t[0]) && t[0] !== t[1])) t.shift();
    return valorDe(t[0] ?? '');
  }
  const i = t.findIndex((x) => ES_NUMERO.test(x) || NO_DETECTADO.test(x) || /^(AUSEN|PRESEN)/.test(x));
  return i < 0 ? null : valorDe(t[i]);
}

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const iso = (a: number, m: number, d: number) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** "19 DE MARZO DE 2026" · "25 DE FEBRERO DEL 2025" (texto normalizado) → ISO */
function fechaEnLetras(texto: string | undefined): string {
  const m = texto && /(\d{1,2}) DE ([A-Z]+) DEL? (\d{4})/.exec(texto);
  const mes = m ? MESES.indexOf(m[2] === 'SETIEMBRE' ? 'SEPTIEMBRE' : m[2]) : -1;
  return m && mes >= 0 ? iso(Number(m[3]), mes + 1, Number(m[1])) : '';
}

/** "0600000/9700000" (o al revés): el norte es el número de 7 cifras que empieza con 9 */
function coordenadas(a: string, b: string): { norte: string; este: string } {
  const [x, y] = [a, b].map((n) => n.replace(/^0+/, ''));
  return /^9\d{6}$/.test(x) && !/^9\d{6}$/.test(y) ? { norte: x, este: y } : { norte: y, este: x };
}

/** Datos del resultado leídos del texto del PDF. null si no es un informe de ELICROM ni de LAB-PSI. */
export function leerInformeLaboratorio(textoPdf: string): LecturaPdf | null {
  const t = textoPdf.replace(/\s+/g, ' ');
  const n = normalizar(textoPdf);
  const elicrom = n.includes('ELICROM');
  const labpsi = /LAB-?PSI/.test(n);
  if (!elicrom && !labpsi) return null;

  // Parámetros: el primero que aparece con cada nombre, desde la tabla de resultados
  const inicio = Math.max(0, elicrom ? n.indexOf('RESULTADOS ') : n.indexOf('PARAMETROS '));
  const tabla = n.slice(inicio);
  const valores: (ValorParametro & { pos: number })[] = [];
  for (const [clave, nombre] of NOMBRES) {
    const m = new RegExp(`(?:^| )${nombre}(?: \\([^)]*\\))? (.*)`).exec(tabla);
    const valor = m && valorTras(m[1], elicrom);
    if (m && valor) valores.push({ clave, valor, pos: m.index });
  }
  valores.sort((a, b) => a.pos - b.pos);
  const lectura = { valores: valores.map(({ clave, valor }) => ({ clave, valor })) };

  if (elicrom) {
    // Los campos que llenó el cliente llevan la nota 9: "Fecha y Hora de Muestreo9:" (o "Muestreo 9 :")
    const campo = (nombre: string, valor: RegExp) => new RegExp(`${nombre}(?: ?9)? ?: ?${valor.source}`).exec(n);
    const muestreo = campo('FECHA Y HORA DE MUESTREO', /(\d{2})\/(\d{2})\/(\d{2,4})/);
    const coord = campo('COORDENADAS GEOGRAFICAS', /(\d+) ?\/ ?(\d+)/);
    const muestreadoPor = campo('MUESTREADO POR', /(.*?) MUESTREADOR/)?.[1] ?? '';
    const codigo = /INFORME DE ENSAYO N\S* ([A-Z]+-[\d-]+\d)/.exec(n)?.[1] ?? '';
    // Los informes PGC-025 ya hechos nombran a ELICROM pero no son informes del laboratorio
    if (!codigo || !lectura.valores.length) return null;
    return {
      laboratorio: 'ELICROM',
      codigo,
      fechaMuestreo: muestreo ? iso(Number(muestreo[3].slice(-2)) + 2000, Number(muestreo[2]), Number(muestreo[1])) : '',
      fechaEmision: fechaEnLetras(/FECHA DE EMISION: [^/]*\/ ([^:]*)/.exec(n)?.[1]),
      locacion: /Locaci[oó]n: (.*?) (?:INFORME DE ENSAYO|Escanee|LABORATORIO DE|IDENTIFICACI)/i.exec(t)?.[1].trim() ?? '',
      ...(coord ? coordenadas(coord[1], coord[2]) : { norte: '', este: '' }),
      metodo: campo('TIPO DE MUESTREO', /COMPUEST/) ? 'Compuesto' : 'Simple',
      muestreoTercero: muestreadoPor.includes('ELICROM'),
      ...lectura,
    };
  }

  if (!lectura.valores.length) return null;
  return {
    laboratorio: 'LAB-PSI',
    codigo: /RA-LAB-?PSI-\d+ ?\d+/.exec(n)?.[0] ?? '',
    fechaMuestreo: fechaEnLetras(/FECHA DE MUESTREO: (.*?) HORA/.exec(n)?.[1]),
    fechaEmision: fechaEnLetras(/EMISION DEL INFORME: (.*?\d{4})/.exec(n)?.[1]),
    locacion: /SITIO DE MUESTREO: (.*?) POSICI[OÓ]N/i.exec(t)?.[1].trim() ?? '',
    norte: /NORTE: ?(\d+)/.exec(n)?.[1] ?? '',
    este: /ESTE: ?(\d+)/.exec(n)?.[1] ?? '',
    metodo: /TIPO DE MUESTRA: [^:]*COMPUEST/.test(n) ? 'Compuesto' : 'Simple',
    muestreoTercero: !/EFECTUADA POR: CLIENTE/.test(n),
    ...lectura,
  };
}

/* ---------- a qué camaroneras corresponde ---------- */

const clave = (s: string) => normalizar(s.replace(/\.pdf$/i, '')).replace(/[^A-Z0-9]/g, '');

/** Palabras que no distinguen una camaronera de otra */
const GENERICAS = new Set(['NATURISA', 'DRENAJE', 'DRENAJES', 'PISCINA', 'PISCINAS', 'EFLUENTE', 'AFLUENTE', 'DESCARGA', 'FINAL', 'LABORATORIO', 'LARVAS', 'CAMARONERA', 'CAMPAMENTO', 'ESTERO', 'ESTACION', 'BOMBEO', 'GRUPO', 'EMPACADORA']);

/** Palabras de un nombre: "Larviquest #1" también da "LQ1" para reconocer "Larviquest S.A. (LQ1)" */
function palabras(texto: string): string[] {
  const n = normalizar(texto);
  const lq = [...n.matchAll(/(?:LARVIQUEST|LQ) ?#? ?(\d)/g)].map((m) => `LQ${m[1]}`);
  return [...new Set([...n.split(/[^A-Z0-9]+/).filter((p) => p.length >= 4 && !GENERICAS.has(p) && !/^\d+$/.test(p)), ...lq])];
}

/**
 * Camaroneras del resultado leído. Primero busca un resultado anterior del mismo punto de muestreo (mismo nombre
 * de PDF o misma locación del laboratorio) y repite sus camaroneras, su locación y sus coordenadas; si no hay, compara
 * las palabras de la locación con los nombres de las fichas técnicas.
 */
export function sugerirDatos(
  lectura: LecturaPdf,
  nombreArchivo: string,
  punto: PuntoMonitoreo,
  sitios: Sitio[],
  anteriores: Resultado[],
): { previo: Resultado | null; datos: Pick<ResultadoDatos, 'sitios' | 'locacion' | 'norte' | 'este'> } {
  const buscadas = [lectura.locacion, nombreArchivo].map(clave).filter(Boolean);
  const previo =
    [...anteriores]
      .filter((r) => r.punto === punto && r.sitios.length)
      .sort((a, b) => b.fechaMuestreo.localeCompare(a.fechaMuestreo))
      .find((r) => [r.pdf?.nombre ?? '', r.locacion].map(clave).some((c) => c && buscadas.includes(c))) ?? null;
  if (previo) {
    return {
      previo,
      datos: { sitios: previo.sitios.filter((id) => sitios.some((s) => s.id === id)), locacion: previo.locacion, norte: previo.norte || lectura.norte, este: previo.este || lectura.este },
    };
  }

  // Cada palabra cuenta para las fichas que la tienen; si varias la tienen, para la que más palabras comparte
  const activos = sitios.filter((s) => s.activo);
  const deSitio = new Map(activos.map((s) => [s.id, new Set(palabras(s.nombre))]));
  const buscar = palabras(lectura.locacion || nombreArchivo).filter((p) => {
    const cuantos = activos.filter((s) => deSitio.get(s.id)!.has(p)).length;
    return cuantos > 0 && cuantos <= 2;
  });
  const puntaje = new Map(activos.map((s) => [s.id, buscar.filter((p) => deSitio.get(s.id)!.has(p)).length]));
  const elegidos = new Set<number>();
  for (const p of buscar) {
    const con = activos.filter((s) => deSitio.get(s.id)!.has(p));
    const mejor = Math.max(...con.map((s) => puntaje.get(s.id)!));
    con.filter((s) => puntaje.get(s.id) === mejor).forEach((s) => elegidos.add(s.id));
  }
  return { previo: null, datos: { sitios: [...elegidos], locacion: lectura.locacion, norte: lectura.norte, este: lectura.este } };
}

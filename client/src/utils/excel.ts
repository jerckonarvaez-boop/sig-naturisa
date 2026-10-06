/**
 * Lector de Excel (.xlsx / .xlsm) sin librerías externas, para el navegador.
 * Lee las "Tablas" de Excel (Insertar ▸ Tabla) por su nombre y devuelve sus filas
 * como objetos cuyas claves son los encabezados normalizados (sin tildes,
 * minúsculas, sin espacios): "Fecha Solped" -> "fechasolped".
 */

export type Celda = string | number | boolean | null;
export type FilaExcel = Record<string, Celda>;

export interface LibroExcel {
  /** Nombres de las tablas que contiene el libro */
  tablas: string[];
  /** Filas de una tabla, o null si no existe */
  tabla(nombre: string): Promise<FilaExcel[] | null>;
}

/** Normaliza un encabezado: "Fecha Solped" -> "fechasolped" */
export const claveEncabezado = (s: unknown) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export async function abrirExcel(buffer: ArrayBuffer): Promise<LibroExcel> {
  const leer = abrirZip(buffer);

  const compartidos: string[] = [];
  const sst = await leer('xl/sharedStrings.xml');
  if (sst) {
    for (const si of Array.from(parsearXml(sst).getElementsByTagName('si'))) {
      let texto = '';
      for (const t of Array.from(si.getElementsByTagName('t'))) if (t.parentNode?.nodeName !== 'rPh') texto += t.textContent;
      compartidos.push(texto);
    }
  }

  const relaciones: Record<string, string> = {};
  const relsLibro = await leer('xl/_rels/workbook.xml.rels');
  const workbook = await leer('xl/workbook.xml');
  if (!relsLibro || !workbook) throw new Error('El archivo no es un Excel .xlsx válido.');
  for (const r of Array.from(parsearXml(relsLibro).getElementsByTagName('Relationship'))) {
    relaciones[r.getAttribute('Id')!] = resolverRuta('xl/workbook.xml', r.getAttribute('Target')!);
  }

  const tablas: Record<string, { hoja: string; ref: string; totales: number }> = {};
  for (const sheet of Array.from(parsearXml(workbook).getElementsByTagName('sheet'))) {
    const hoja = relaciones[sheet.getAttribute('r:id') ?? ''];
    if (!hoja) continue;
    const relsHoja = await leer(hoja.replace(/([^/]+)$/, '_rels/$1.rels'));
    if (!relsHoja) continue;
    for (const r of Array.from(parsearXml(relsHoja).getElementsByTagName('Relationship'))) {
      if (!/\/table$/.test(r.getAttribute('Type') ?? '')) continue;
      const xmlTabla = await leer(resolverRuta(hoja, r.getAttribute('Target')!));
      if (!xmlTabla) continue;
      const t = parsearXml(xmlTabla).documentElement;
      tablas[t.getAttribute('name')!] = {
        hoja,
        ref: t.getAttribute('ref') ?? '',
        totales: Number(t.getAttribute('totalsRowCount') || 0),
      };
    }
  }

  const cacheHojas: Record<string, Document> = {};
  async function hoja(ruta: string) {
    if (!cacheHojas[ruta]) cacheHojas[ruta] = parsearXml((await leer(ruta)) ?? '');
    return cacheHojas[ruta];
  }

  function valorCelda(c: Element): Celda {
    const tipo = c.getAttribute('t');
    const v = c.getElementsByTagName('v')[0];
    if (tipo === 's') return v ? compartidos[Number(v.textContent)] : null;
    if (tipo === 'inlineStr') return c.textContent;
    if (tipo === 'e') return null;
    if (tipo === 'str') return v ? v.textContent : null;
    if (tipo === 'b') return v ? v.textContent === '1' : null;
    if (!v) return null;
    const n = parseFloat(v.textContent ?? '');
    return Number.isNaN(n) ? v.textContent : n;
  }

  async function matriz(ruta: string, ref: string, totales: number): Promise<Celda[][]> {
    const doc = await hoja(ruta);
    const [a, b] = ref.split(':');
    const [c0, r0] = refCelda(a);
    const [c1, r1Total] = refCelda(b);
    const r1 = r1Total - totales;
    const filas: Celda[][] = Array.from({ length: r1 - r0 + 1 }, () => new Array(c1 - c0 + 1).fill(null));
    for (const c of Array.from(doc.getElementsByTagName('c'))) {
      const r = c.getAttribute('r');
      if (!r) continue;
      const [ci, ri] = refCelda(r);
      if (ri < r0 || ri > r1 || ci < c0 || ci > c1) continue;
      const valor = valorCelda(c);
      if (valor !== null && valor !== '') filas[ri - r0][ci - c0] = valor;
    }
    return filas;
  }

  return {
    tablas: Object.keys(tablas),
    async tabla(nombre) {
      const t = tablas[nombre];
      if (!t || !t.ref.includes(':')) return null;
      const [encabezado, ...filas] = await matriz(t.hoja, t.ref, t.totales);
      const claves = encabezado.map(claveEncabezado);
      return filas
        .filter((f) => f.some((v) => v !== null && v !== ''))
        .map((f) => Object.fromEntries(claves.map((k, i) => [k, f[i]])));
    },
  };
}

/* ---------- conversión de valores ---------- */

export const aTexto = (v: Celda | undefined) => (v == null ? '' : String(v).trim());

export const aNumero = (v: Celda | undefined) =>
  typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')) || 0;

/** Fecha de Excel (número de serie o texto) -> AAAA-MM-DD */
export function aFechaISO(v: Celda | undefined): string {
  if (v == null || v === '') return '';
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5).toISOString().slice(0, 10);
  }
  const s = String(v);
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

/* ---------- internos: ZIP y XML ---------- */

const parsearXml = (s: string) => new DOMParser().parseFromString(s, 'application/xml');

async function inflar(datos: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([datos as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function abrirZip(buffer: ArrayBuffer) {
  const dv = new DataView(buffer);
  const u8 = new Uint8Array(buffer);
  const td = new TextDecoder();

  let fin = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin < 0) throw new Error('El archivo no es un Excel .xlsx válido.');

  const total = dv.getUint16(fin + 10, true);
  let p = dv.getUint32(fin + 16, true);
  const entradas: Record<string, { metodo: number; tam: number; offset: number }> = {};
  for (let k = 0; k < total; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const metodo = dv.getUint16(p + 10, true);
    const tam = dv.getUint32(p + 20, true);
    const nl = dv.getUint16(p + 28, true);
    const xl = dv.getUint16(p + 30, true);
    const cl = dv.getUint16(p + 32, true);
    const offset = dv.getUint32(p + 42, true);
    entradas[td.decode(u8.subarray(p + 46, p + 46 + nl))] = { metodo, tam, offset };
    p += 46 + nl + xl + cl;
  }

  return async (nombre: string): Promise<string | null> => {
    const e = entradas[nombre];
    if (!e) return null;
    const inicio = e.offset + 30 + dv.getUint16(e.offset + 26, true) + dv.getUint16(e.offset + 28, true);
    const crudo = u8.subarray(inicio, inicio + e.tam);
    return td.decode(e.metodo === 0 ? crudo : await inflar(crudo));
  };
}

function resolverRuta(base: string, destino: string) {
  if (destino.startsWith('/')) return destino.slice(1);
  const partes = base.split('/');
  partes.pop();
  for (const s of destino.split('/')) {
    if (s === '..') partes.pop();
    else if (s && s !== '.') partes.push(s);
  }
  return partes.join('/');
}

/** "C12" -> [columna 2, fila 11] (base 0) */
function refCelda(ref: string): [number, number] {
  const m = /^([A-Z]+)(\d+)$/.exec(ref)!;
  let col = 0;
  for (const ch of m[1]) col = col * 26 + ch.charCodeAt(0) - 64;
  return [col - 1, Number(m[2]) - 1];
}

import type { InStatement } from '@libsql/client';
import { consultar, consultarUna, ejecutar, lote, transaction, type Fila } from '../../db/database.js';
import {
  CAMPOS_EDICION,
  CAMPOS_TEXTOS,
  type EdicionInforme,
  type Logo,
  type Punto,
  type Resultado,
  type ResultadoDatos,
  type Sitio,
  type SitioDatos,
  type TextosInforme,
  type TipoSitio,
} from './monitoreo-agua.types.js';

const jsonLista = <T>(v: unknown): T[] => {
  try {
    const r = JSON.parse(String(v ?? '[]'));
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
};

function aTextos(v: unknown): TextosInforme {
  let o: Record<string, unknown> = {};
  try {
    o = JSON.parse(String(v ?? '{}')) ?? {};
  } catch {
    /* textos vacíos */
  }
  return Object.fromEntries(CAMPOS_TEXTOS.map((c) => [c, String(o[c] ?? '')])) as unknown as TextosInforme;
}

/* ---------- camaroneras e instalaciones ---------- */

function aSitio(r: Fila): Sitio {
  return {
    id: Number(r.id),
    numero: Number(r.numero),
    nombre: String(r.nombre),
    tipo: String(r.tipo) as TipoSitio,
    lugar: String(r.lugar ?? ''),
    entidad: String(r.entidad ?? ''),
    representante: String(r.representante ?? ''),
    ruc: String(r.ruc ?? ''),
    tipoProyecto: String(r.tipo_proyecto ?? ''),
    oficina: String(r.oficina ?? ''),
    ubicacion: String(r.ubicacion ?? ''),
    coordenadasTitulo: String(r.coordenadas_titulo ?? ''),
    coordenadas: jsonLista(r.coordenadas),
    superficie: String(r.superficie ?? ''),
    activo: Number(r.activo) === 1,
    tituloEncabezado: String(r.titulo_encabezado ?? ''),
    logos: jsonLista<number>(r.logos).map(Number),
    logoTexto: String(r.logo_texto ?? ''),
    textos: aTextos(r.textos),
    resultados: Number(r.resultados ?? 0),
  };
}

const SELECT_SITIO = `SELECT s.*, (SELECT COUNT(*) FROM monitoreo_resultado_sitio rs WHERE rs.sitio_id = s.id) AS resultados
                      FROM monitoreo_sitio s`;

const valoresSitio = (d: SitioDatos) => [
  d.numero, d.nombre, d.tipo, d.lugar, d.entidad, d.representante, d.ruc, d.tipoProyecto, d.oficina, d.ubicacion,
  d.coordenadasTitulo, JSON.stringify(d.coordenadas), d.superficie, d.activo ? 1 : 0,
  d.tituloEncabezado, JSON.stringify(d.logos), d.logoTexto, JSON.stringify(d.textos),
];

export async function listarSitios(): Promise<Sitio[]> {
  return (await consultar(`${SELECT_SITIO} ORDER BY s.numero, s.nombre`)).map(aSitio);
}

export async function obtenerSitio(id: number): Promise<Sitio | null> {
  const f = await consultarUna(`${SELECT_SITIO} WHERE s.id = ?`, [id]);
  return f ? aSitio(f) : null;
}

export async function crearSitio(d: SitioDatos): Promise<Sitio> {
  const { id } = await ejecutar(
    `INSERT INTO monitoreo_sitio (numero, nombre, tipo, lugar, entidad, representante, ruc, tipo_proyecto, oficina,
       ubicacion, coordenadas_titulo, coordenadas, superficie, activo, titulo_encabezado, logos, logo_texto, textos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    valoresSitio(d),
  );
  return (await obtenerSitio(id))!;
}

export async function actualizarSitio(id: number, d: SitioDatos): Promise<Sitio | null> {
  const { cambios } = await ejecutar(
    `UPDATE monitoreo_sitio SET numero = ?, nombre = ?, tipo = ?, lugar = ?, entidad = ?, representante = ?, ruc = ?,
       tipo_proyecto = ?, oficina = ?, ubicacion = ?, coordenadas_titulo = ?, coordenadas = ?, superficie = ?, activo = ?,
       titulo_encabezado = ?, logos = ?, logo_texto = ?, textos = ?,
       actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
     WHERE id = ?`,
    [...valoresSitio(d), id],
  );
  return cambios ? obtenerSitio(id) : null;
}

/** Borra la camaronera si no tiene resultados ('en-uso' si los tiene, para desactivarla en su lugar) */
export async function eliminarSitio(id: number): Promise<'ok' | 'no-existe' | 'en-uso'> {
  const sitio = await obtenerSitio(id);
  if (!sitio) return 'no-existe';
  if (sitio.resultados) return 'en-uso';
  await ejecutar('DELETE FROM monitoreo_sitio WHERE id = ?', [id]);
  return 'ok';
}

/** Ids de sitios que no existen (para validar un resultado) */
export async function sitiosInexistentes(ids: number[]): Promise<number[]> {
  const filas = await consultar(`SELECT id FROM monitoreo_sitio WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
  const existen = new Set(filas.map((f) => Number(f.id)));
  return ids.filter((id) => !existen.has(id));
}

/* ---------- logos ---------- */

export async function listarLogos(): Promise<Logo[]> {
  return (await consultar('SELECT id, nombre, tipo, tamano FROM monitoreo_logo ORDER BY id')).map((f) => ({
    id: Number(f.id),
    nombre: String(f.nombre),
    tipo: String(f.tipo),
    tamano: Number(f.tamano),
  }));
}

export async function obtenerLogo(id: number): Promise<{ tipo: string; datos: Uint8Array } | null> {
  const f = await consultarUna('SELECT tipo, datos FROM monitoreo_logo WHERE id = ?', [id]);
  return f ? { tipo: String(f.tipo), datos: new Uint8Array(f.datos as ArrayBuffer) } : null;
}

export async function crearLogo(nombre: string, tipo: string, datos: Uint8Array): Promise<Logo> {
  const { id } = await ejecutar('INSERT INTO monitoreo_logo (nombre, tipo, tamano, datos) VALUES (?, ?, ?, ?)', [nombre, tipo, datos.length, datos]);
  return { id, nombre, tipo, tamano: datos.length };
}

/** Borra el logo si ninguna camaronera lo usa */
export async function eliminarLogo(id: number): Promise<'ok' | 'no-existe' | 'en-uso'> {
  if (!(await consultarUna('SELECT id FROM monitoreo_logo WHERE id = ?', [id]))) return 'no-existe';
  if ((await listarSitios()).some((s) => s.logos.includes(id))) return 'en-uso';
  await ejecutar('DELETE FROM monitoreo_logo WHERE id = ?', [id]);
  return 'ok';
}

/** Ids de logos que no existen (para validar una ficha) */
export async function logosInexistentes(ids: number[]): Promise<number[]> {
  if (!ids.length) return [];
  const filas = await consultar(`SELECT id FROM monitoreo_logo WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
  const existen = new Set(filas.map((f) => Number(f.id)));
  return ids.filter((id) => !existen.has(id));
}

/* ---------- resultados de laboratorio ---------- */

const SELECT_RESULTADO = `SELECT r.*, p.nombre AS pdf_nombre, p.tamano AS pdf_tamano,
                            (SELECT json_group_array(rs.sitio_id) FROM monitoreo_resultado_sitio rs WHERE rs.resultado_id = r.id) AS sitios,
                            (SELECT json_group_object(i.sitio_id, json(i.textos)) FROM monitoreo_informe i WHERE i.resultado_id = r.id) AS ediciones
                          FROM monitoreo_resultado r LEFT JOIN monitoreo_resultado_pdf p ON p.resultado_id = r.id`;

/** {"3": {"objetivo": "…"}} → solo los campos conocidos con texto */
function aEdiciones(v: unknown): Record<number, EdicionInforme> {
  let o: Record<string, Record<string, unknown>> = {};
  try {
    o = JSON.parse(String(v ?? '{}')) ?? {};
  } catch {
    /* sin ediciones */
  }
  return Object.fromEntries(
    Object.entries(o).map(([sitio, t]) => [Number(sitio), Object.fromEntries(CAMPOS_EDICION.filter((c) => t?.[c]).map((c) => [c, String(t[c])]))]),
  );
}

function aResultado(r: Fila): Resultado {
  return {
    id: Number(r.id),
    punto: String(r.punto) as Punto,
    laboratorio: String(r.laboratorio ?? ''),
    codigo: String(r.codigo ?? ''),
    fechaMuestreo: String(r.fecha_muestreo),
    fechaEmision: String(r.fecha_emision ?? ''),
    locacion: String(r.locacion ?? ''),
    norte: String(r.norte ?? ''),
    este: String(r.este ?? ''),
    metodo: String(r.metodo ?? ''),
    muestreoTercero: Number(r.muestreo_tercero) === 1,
    sitios: jsonLista<number>(r.sitios).map(Number).sort((a, b) => a - b),
    valores: jsonLista(r.valores),
    observaciones: String(r.observaciones ?? ''),
    pdf: r.pdf_nombre == null ? null : { nombre: String(r.pdf_nombre), tamano: Number(r.pdf_tamano) },
    ediciones: aEdiciones(r.ediciones),
    creadoEn: String(r.creado_en),
    actualizadoEn: String(r.actualizado_en),
  };
}

const valoresResultado = (d: ResultadoDatos) => [
  d.punto, d.laboratorio, d.codigo, d.fechaMuestreo, d.fechaEmision, d.locacion, d.norte, d.este, d.metodo,
  d.muestreoTercero ? 1 : 0, JSON.stringify(d.valores), d.observaciones,
];

const sentenciasSitios = (id: number, sitios: number[]): InStatement[] => [
  { sql: 'DELETE FROM monitoreo_resultado_sitio WHERE resultado_id = ?', args: [id] },
  ...sitios.map((s) => ({ sql: 'INSERT INTO monitoreo_resultado_sitio (resultado_id, sitio_id) VALUES (?, ?)', args: [id, s] })),
];

/** Resultados (de un punto, o todos), del más reciente al más antiguo */
export async function listarResultados(punto?: Punto): Promise<Resultado[]> {
  const filas = punto
    ? await consultar(`${SELECT_RESULTADO} WHERE r.punto = ? ORDER BY r.fecha_muestreo DESC, r.id DESC`, [punto])
    : await consultar(`${SELECT_RESULTADO} ORDER BY r.fecha_muestreo DESC, r.id DESC`);
  return filas.map(aResultado);
}

export async function obtenerResultado(id: number): Promise<Resultado | null> {
  const f = await consultarUna(`${SELECT_RESULTADO} WHERE r.id = ?`, [id]);
  return f ? aResultado(f) : null;
}

export async function crearResultado(d: ResultadoDatos): Promise<Resultado> {
  const id = await transaction(async (tx) => {
    const { id } = await ejecutar(
      `INSERT INTO monitoreo_resultado (punto, laboratorio, codigo, fecha_muestreo, fecha_emision, locacion, norte, este,
         metodo, muestreo_tercero, valores, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      valoresResultado(d),
      tx,
    );
    await lote(sentenciasSitios(id, d.sitios), tx);
    return id;
  });
  return (await obtenerResultado(id))!;
}

export async function actualizarResultado(id: number, d: ResultadoDatos): Promise<Resultado | null> {
  if (!(await consultarUna('SELECT id FROM monitoreo_resultado WHERE id = ?', [id]))) return null;
  await lote([
    {
      sql: `UPDATE monitoreo_resultado SET punto = ?, laboratorio = ?, codigo = ?, fecha_muestreo = ?, fecha_emision = ?,
              locacion = ?, norte = ?, este = ?, metodo = ?, muestreo_tercero = ?, valores = ?, observaciones = ?,
              actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
            WHERE id = ?`,
      args: [...valoresResultado(d), id],
    },
    ...sentenciasSitios(id, d.sitios),
  ]);
  return obtenerResultado(id);
}

export async function eliminarResultado(id: number): Promise<boolean> {
  const [, , , cambios] = await lote([
    { sql: 'DELETE FROM monitoreo_informe WHERE resultado_id = ?', args: [id] },
    { sql: 'DELETE FROM monitoreo_resultado_sitio WHERE resultado_id = ?', args: [id] },
    { sql: 'DELETE FROM monitoreo_resultado_pdf WHERE resultado_id = ?', args: [id] },
    { sql: 'DELETE FROM monitoreo_resultado WHERE id = ?', args: [id] },
  ]);
  return cambios > 0;
}

/** Guarda los textos corregidos del informe de una camaronera (sin textos, vuelve a los de la ficha) */
export async function guardarEdicion(id: number, sitio: number, textos: EdicionInforme): Promise<Resultado | 'no-existe' | 'sin-sitio'> {
  const r = await obtenerResultado(id);
  if (!r) return 'no-existe';
  if (!r.sitios.includes(sitio)) return 'sin-sitio';
  if (Object.keys(textos).length) {
    await ejecutar(
      `INSERT INTO monitoreo_informe (resultado_id, sitio_id, textos) VALUES (?, ?, ?)
       ON CONFLICT (resultado_id, sitio_id) DO UPDATE SET textos = excluded.textos,
         actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
      [id, sitio, JSON.stringify(textos)],
    );
  } else {
    await ejecutar('DELETE FROM monitoreo_informe WHERE resultado_id = ? AND sitio_id = ?', [id, sitio]);
  }
  return (await obtenerResultado(id))!;
}

/* ---------- PDF del laboratorio ---------- */

export async function obtenerPdf(id: number): Promise<{ nombre: string; datos: Uint8Array } | null> {
  const f = await consultarUna('SELECT nombre, datos FROM monitoreo_resultado_pdf WHERE resultado_id = ?', [id]);
  return f ? { nombre: String(f.nombre), datos: new Uint8Array(f.datos as ArrayBuffer) } : null;
}

/** Guarda (o reemplaza) el PDF; false si el resultado no existe */
export async function guardarPdf(id: number, nombre: string, datos: Uint8Array): Promise<boolean> {
  if (!(await consultarUna('SELECT id FROM monitoreo_resultado WHERE id = ?', [id]))) return false;
  await ejecutar(
    `INSERT INTO monitoreo_resultado_pdf (resultado_id, nombre, tamano, datos) VALUES (?, ?, ?, ?)
     ON CONFLICT (resultado_id) DO UPDATE SET nombre = excluded.nombre, tamano = excluded.tamano, datos = excluded.datos,
       creado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
    [id, nombre, datos.length, datos],
  );
  return true;
}

export async function eliminarPdf(id: number): Promise<boolean> {
  return (await ejecutar('DELETE FROM monitoreo_resultado_pdf WHERE resultado_id = ?', [id])).cambios > 0;
}

import { esFecha, esUnoDe, texto, type Validado } from '../../utils/validacion.js';
import { CLAVES_PARAMETROS } from './monitoreo-agua.parametros.js';
import {
  CAMPOS_EDICION,
  CAMPOS_TEXTOS,
  PUNTOS,
  TIPOS_SITIO,
  type Coordenada,
  type EdicionInforme,
  type ResultadoDatos,
  type SitioDatos,
  type TextosInforme,
  type ValorParametro,
} from './monitoreo-agua.types.js';

/** Tamaño máximo del PDF del laboratorio */
export const MAX_PDF = 8 * 1024 * 1024;
/** Tamaño máximo de un logo */
export const MAX_LOGO = 1024 * 1024;
const TIPOS_LOGO = ['image/png', 'image/jpeg', 'image/webp'];

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function validarSitio(body: Record<string, unknown> | undefined): Validado<SitioDatos> {
  if (!body) return { error: 'Faltan los datos de la camaronera.' };
  const nombre = texto(body.nombre, 200);
  if (!nombre) return { error: 'Indique el nombre de la camaronera o instalación.' };
  const numero = body.numero;
  if (typeof numero !== 'number' || !Number.isInteger(numero) || numero < 0 || numero > 999) {
    return { error: 'El número de informe debe ser un entero entre 0 y 999.' };
  }
  if (!esUnoDe(TIPOS_SITIO, body.tipo)) return { error: 'Tipo de instalación no válido.' };
  const coordenadas = lista(body.coordenadas);
  if (coordenadas.length > 200) return { error: 'Máximo 200 coordenadas.' };
  const logos = [...new Set(lista(body.logos))];
  if (logos.length > 2 || !logos.every((l) => typeof l === 'number' && Number.isInteger(l) && l > 0)) {
    return { error: 'Elija como máximo dos logos.' };
  }
  const t = (body.textos ?? {}) as Record<string, unknown>;
  const textos = Object.fromEntries(CAMPOS_TEXTOS.map((c) => [c, texto(t[c], 3000)])) as unknown as TextosInforme;

  return {
    datos: {
      numero,
      nombre,
      tipo: body.tipo,
      lugar: texto(body.lugar, 300),
      entidad: texto(body.entidad, 300),
      representante: texto(body.representante, 200),
      ruc: texto(body.ruc, 20),
      tipoProyecto: texto(body.tipoProyecto, 200),
      oficina: texto(body.oficina, 1000),
      ubicacion: texto(body.ubicacion, 1000),
      coordenadasTitulo: texto(body.coordenadasTitulo, 200),
      coordenadas: coordenadas
        .map((c): Coordenada => {
          const o = (c ?? {}) as Record<string, unknown>;
          return { punto: texto(o.punto, 20), norte: texto(o.norte, 30), este: texto(o.este, 30) };
        })
        .filter((c) => c.norte || c.este),
      superficie: texto(body.superficie, 1000),
      activo: body.activo !== false,
      tituloEncabezado: texto(body.tituloEncabezado, 300),
      logos: logos as number[],
      logoTexto: texto(body.logoTexto, 200),
      textos,
    },
  };
}

export function validarResultado(body: Record<string, unknown> | undefined): Validado<ResultadoDatos> {
  if (!body) return { error: 'Faltan los datos del resultado.' };
  if (!esUnoDe(PUNTOS, body.punto)) return { error: 'Indique si es afluente o efluente.' };
  if (!esFecha(body.fechaMuestreo)) return { error: 'La fecha de muestreo no es válida.' };
  if (body.fechaEmision && !esFecha(body.fechaEmision)) return { error: 'La fecha de emisión no es válida.' };

  const sitios = [...new Set(lista(body.sitios))];
  if (!sitios.length) return { error: 'Elija al menos una camaronera o instalación.' };
  if (!sitios.every((s) => typeof s === 'number' && Number.isInteger(s) && s > 0)) return { error: 'Camaronera no válida.' };

  const valores: ValorParametro[] = [];
  for (const v of lista(body.valores)) {
    const o = (v ?? {}) as Record<string, unknown>;
    if (!esUnoDe(CLAVES_PARAMETROS, o.clave)) return { error: 'Hay un parámetro que no está en el catálogo.' };
    if (valores.some((x) => x.clave === o.clave)) return { error: 'Hay un parámetro repetido.' };
    valores.push({ clave: o.clave, valor: texto(o.valor, 40) });
  }
  if (!valores.some((v) => v.valor)) return { error: 'Ingrese el resultado de al menos un parámetro.' };

  return {
    datos: {
      punto: body.punto,
      laboratorio: texto(body.laboratorio, 120),
      codigo: texto(body.codigo, 60),
      fechaMuestreo: body.fechaMuestreo,
      fechaEmision: esFecha(body.fechaEmision) ? body.fechaEmision : '',
      locacion: texto(body.locacion, 300),
      norte: texto(body.norte, 30),
      este: texto(body.este, 30),
      metodo: texto(body.metodo, 60) || 'Simple',
      muestreoTercero: body.muestreoTercero === true,
      sitios: sitios as number[],
      valores,
      observaciones: texto(body.observaciones, 2000),
    },
  };
}

/** Logo en base64 con prefijo data:image/… → bytes, o el error */
export function validarLogo(body: Record<string, unknown> | undefined): Validado<{ nombre: string; tipo: string; datos: Uint8Array }> {
  const nombre = texto(body?.nombre, 120) || 'logo';
  const m = typeof body?.datos === 'string' ? /^data:([^;,]+);base64,(.+)$/s.exec(body.datos) : null;
  if (!m) return { error: 'Falta la imagen del logo.' };
  if (!TIPOS_LOGO.includes(m[1])) return { error: 'El logo debe ser PNG, JPG o WEBP.' };
  const datos = new Uint8Array(Buffer.from(m[2], 'base64'));
  if (datos.length > MAX_LOGO) return { error: 'El logo pesa más de 1 MB.' };
  return { datos: { nombre, tipo: m[1], datos } };
}

/** PDF en base64 (con o sin prefijo data:) → bytes, o el error */
export function validarPdf(body: Record<string, unknown> | undefined): Validado<{ nombre: string; datos: Uint8Array }> {
  const nombre = texto(body?.nombre, 200) || 'informe.pdf';
  const base64 = typeof body?.datos === 'string' ? body.datos.replace(/^data:[^,]*,/, '') : '';
  if (!base64) return { error: 'Falta el archivo PDF.' };
  const datos = new Uint8Array(Buffer.from(base64, 'base64'));
  if (datos.length > MAX_PDF) return { error: 'El PDF pesa más de 8 MB.' };
  if (Buffer.from(datos.subarray(0, 5)).toString('latin1') !== '%PDF-') return { error: 'El archivo no es un PDF.' };
  return { datos: { nombre, datos } };
}

/** Textos corregidos de un informe: solo los que tienen contenido */
export function validarEdicion(body: Record<string, unknown> | undefined): Validado<EdicionInforme> {
  const t = (body?.textos ?? {}) as Record<string, unknown>;
  if (typeof t !== 'object' || Array.isArray(t)) return { error: 'Textos no válidos.' };
  const datos: EdicionInforme = {};
  for (const c of CAMPOS_EDICION) {
    const v = texto(t[c], 5000);
    if (v) datos[c] = v;
  }
  return { datos };
}

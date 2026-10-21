import type { RequestHandler } from 'express';
import { esUnoDe } from '../../utils/validacion.js';
import { PARAMETROS_MONITOREO, PARAMETROS_PREDETERMINADOS } from './monitoreo-agua.parametros.js';
import {
  actualizarResultado,
  actualizarSitio,
  crearResultado,
  crearSitio,
  eliminarPdf,
  eliminarResultado,
  eliminarSitio,
  guardarPdf,
  listarResultados,
  listarSitios,
  obtenerPdf,
  obtenerResultado,
  sitiosInexistentes,
} from './monitoreo-agua.service.js';
import { PUNTOS, type ResultadoDatos } from './monitoreo-agua.types.js';
import { validarPdf, validarResultado, validarSitio } from './monitoreo-agua.validator.js';

const id = (v: unknown) => Number(v);

// GET /api/monitoreo-agua/definicion -> catálogo de parámetros con sus límites y los que vienen por defecto
export const definicion: RequestHandler = (_req, res) => {
  res.json({ parametros: PARAMETROS_MONITOREO, predeterminados: PARAMETROS_PREDETERMINADOS });
};

/* ---------- camaroneras e instalaciones ---------- */

// GET /api/monitoreo-agua/sitios
export const sitios: RequestHandler = async (_req, res) => {
  res.json(await listarSitios());
};

// POST /api/monitoreo-agua/sitios
export const crearUnSitio: RequestHandler = async (req, res) => {
  const v = validarSitio(req.body);
  if ('error' in v) {
    res.status(400).json({ error: v.error });
    return;
  }
  res.status(201).json(await crearSitio(v.datos));
};

// PUT /api/monitoreo-agua/sitios/:id
export const actualizarUnSitio: RequestHandler = async (req, res) => {
  const v = validarSitio(req.body);
  if ('error' in v) {
    res.status(400).json({ error: v.error });
    return;
  }
  const sitio = await actualizarSitio(id(req.params.id), v.datos);
  if (!sitio) {
    res.status(404).json({ error: 'La camaronera no existe.' });
    return;
  }
  res.json(sitio);
};

// DELETE /api/monitoreo-agua/sitios/:id
export const eliminarUnSitio: RequestHandler = async (req, res) => {
  const r = await eliminarSitio(id(req.params.id));
  if (r === 'no-existe') res.status(404).json({ error: 'La camaronera no existe.' });
  else if (r === 'en-uso') res.status(409).json({ error: 'Tiene resultados registrados: desactívela en lugar de eliminarla.' });
  else res.status(204).end();
};

/* ---------- resultados ---------- */

/** Valida el cuerpo y que las camaroneras existan */
async function validarConSitios(body: Record<string, unknown> | undefined): Promise<{ datos: ResultadoDatos } | { error: string }> {
  const v = validarResultado(body);
  if ('error' in v) return v;
  if ((await sitiosInexistentes(v.datos.sitios)).length) return { error: 'Una de las camaroneras elegidas ya no existe.' };
  return v;
}

// GET /api/monitoreo-agua/resultados?punto=efluente
export const resultados: RequestHandler = async (req, res) => {
  const punto = req.query.punto;
  if (punto !== undefined && !esUnoDe(PUNTOS, punto)) {
    res.status(400).json({ error: 'Punto no válido.' });
    return;
  }
  res.json(await listarResultados(punto));
};

// GET /api/monitoreo-agua/resultados/:id
export const resultado: RequestHandler = async (req, res) => {
  const r = await obtenerResultado(id(req.params.id));
  if (!r) {
    res.status(404).json({ error: 'El resultado no existe.' });
    return;
  }
  res.json(r);
};

// POST /api/monitoreo-agua/resultados
export const crearUnResultado: RequestHandler = async (req, res) => {
  const v = await validarConSitios(req.body);
  if ('error' in v) {
    res.status(400).json({ error: v.error });
    return;
  }
  res.status(201).json(await crearResultado(v.datos));
};

// PUT /api/monitoreo-agua/resultados/:id
export const actualizarUnResultado: RequestHandler = async (req, res) => {
  const v = await validarConSitios(req.body);
  if ('error' in v) {
    res.status(400).json({ error: v.error });
    return;
  }
  const r = await actualizarResultado(id(req.params.id), v.datos);
  if (!r) {
    res.status(404).json({ error: 'El resultado no existe.' });
    return;
  }
  res.json(r);
};

// DELETE /api/monitoreo-agua/resultados/:id
export const eliminarUnResultado: RequestHandler = async (req, res) => {
  if (!(await eliminarResultado(id(req.params.id)))) {
    res.status(404).json({ error: 'El resultado no existe.' });
    return;
  }
  res.status(204).end();
};

/* ---------- PDF del laboratorio ---------- */

// GET /api/monitoreo-agua/resultados/:id/pdf -> se abre en el navegador
export const pdf: RequestHandler = async (req, res) => {
  const archivo = await obtenerPdf(id(req.params.id));
  if (!archivo) {
    res.status(404).json({ error: 'El resultado no tiene PDF.' });
    return;
  }
  res
    .set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`)
    .set('Cache-Control', 'private, no-cache')
    .type('application/pdf')
    .send(Buffer.from(archivo.datos));
};

// PUT /api/monitoreo-agua/resultados/:id/pdf { nombre, datos (base64) }
export const subirPdf: RequestHandler = async (req, res) => {
  const v = validarPdf(req.body);
  if ('error' in v) {
    res.status(400).json({ error: v.error });
    return;
  }
  if (!(await guardarPdf(id(req.params.id), v.datos.nombre, v.datos.datos))) {
    res.status(404).json({ error: 'El resultado no existe.' });
    return;
  }
  res.json(await obtenerResultado(id(req.params.id)));
};

// DELETE /api/monitoreo-agua/resultados/:id/pdf
export const quitarPdf: RequestHandler = async (req, res) => {
  if (!(await eliminarPdf(id(req.params.id)))) {
    res.status(404).json({ error: 'El resultado no tiene PDF.' });
    return;
  }
  res.status(204).end();
};

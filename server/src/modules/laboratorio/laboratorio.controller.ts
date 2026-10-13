import type { RequestHandler } from 'express';
import { esUnoDe } from '../../utils/validacion.js';
import { CLIENTES_LABORATORIO, SECCIONES, type SeccionId } from './laboratorio.secciones.js';
import { actualizarInforme, crearInforme, eliminarInforme, listarInformes, obtenerInforme } from './laboratorio.service.js';
import {
  guardarDestinatarios,
  guardarPlantilla,
  normalizarCorreos,
  obtenerDestinatarios,
  obtenerPlantilla,
  validarPlantilla,
} from './laboratorio.correo.js';
import { validarInforme } from './laboratorio.validator.js';

const SECCIONES_IDS = Object.keys(SECCIONES) as SeccionId[];

// GET /api/laboratorio/secciones -> definición de cada sección (parámetros, tipos, unidades, referencias)
export const secciones: RequestHandler = (_req, res) => {
  res.json({ secciones: SECCIONES, clientes: CLIENTES_LABORATORIO });
};

// GET /api/laboratorio/informes?seccion=agua
export const listar: RequestHandler = async (req, res) => {
  if (!esUnoDe(SECCIONES_IDS, req.query.seccion)) {
    res.status(400).json({ error: 'Indique una sección válida (agua, suelo o patologia).' });
    return;
  }
  res.json(await listarInformes(req.query.seccion));
};

// GET /api/laboratorio/informes/:id
export const obtener: RequestHandler = async (req, res) => {
  const informe = await obtenerInforme(Number(req.params.id));
  if (!informe) {
    res.status(404).json({ error: 'El informe no existe.' });
    return;
  }
  res.json(informe);
};

// POST /api/laboratorio/informes
export const crear: RequestHandler = async (req, res) => {
  const resultado = validarInforme(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  res.status(201).json(await crearInforme(resultado.datos));
};

// PUT /api/laboratorio/informes/:id
export const actualizar: RequestHandler = async (req, res) => {
  const resultado = validarInforme(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  const informe = await actualizarInforme(Number(req.params.id), resultado.datos);
  if (!informe) {
    res.status(404).json({ error: 'El informe no existe.' });
    return;
  }
  res.json(informe);
};

// DELETE /api/laboratorio/informes/:id
export const eliminar: RequestHandler = async (req, res) => {
  if (!(await eliminarInforme(Number(req.params.id)))) {
    res.status(404).json({ error: 'El informe no existe.' });
    return;
  }
  res.status(204).end();
};

// GET /api/laboratorio/correo?sucursal=X -> texto predeterminado + últimos destinatarios de ese centro de costo
export const correo: RequestHandler = async (req, res) => {
  const sucursal = typeof req.query.sucursal === 'string' ? req.query.sucursal : '';
  const [plantilla, destinatarios] = await Promise.all([obtenerPlantilla(), sucursal ? obtenerDestinatarios(sucursal) : { para: '', cc: '' }]);
  res.json({ plantilla, ...destinatarios });
};

// PUT /api/laboratorio/correo/plantilla { asunto, mensaje }
export const cambiarPlantilla: RequestHandler = async (req, res) => {
  const resultado = validarPlantilla(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  res.json(await guardarPlantilla(resultado.datos));
};

// PUT /api/laboratorio/correo/destinatarios { sucursal, para, cc }
export const cambiarDestinatarios: RequestHandler = async (req, res) => {
  const sucursal = typeof req.body?.sucursal === 'string' ? req.body.sucursal.trim().slice(0, 120) : '';
  const para = normalizarCorreos(req.body?.para);
  const cc = normalizarCorreos(req.body?.cc);
  if (!sucursal) {
    res.status(400).json({ error: 'Falta el centro de costo.' });
    return;
  }
  for (const r of [para, cc]) {
    if (typeof r !== 'string') {
      res.status(400).json({ error: r.error });
      return;
    }
  }
  await guardarDestinatarios(sucursal, para as string, cc as string);
  res.json({ para, cc });
};

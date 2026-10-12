import type { RequestHandler } from 'express';
import {
  actualizarReparacion,
  crearReparacion,
  eliminarReparacion,
  listarReparaciones,
} from './oxigenometros.service.js';
import { validarReparacion } from './oxigenometros.validator.js';

// GET /api/oxigenometros/reparaciones
export const listar: RequestHandler = async (_req, res) => {
  res.json(await listarReparaciones());
};

// POST /api/oxigenometros/reparaciones
export const crear: RequestHandler = async (req, res) => {
  const resultado = validarReparacion(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  res.status(201).json(await crearReparacion(resultado.datos));
};

// PUT /api/oxigenometros/reparaciones/:id
export const actualizar: RequestHandler = async (req, res) => {
  const resultado = validarReparacion(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  const reparacion = await actualizarReparacion(Number(req.params.id), resultado.datos);
  if (!reparacion) {
    res.status(404).json({ error: 'La reparación no existe.' });
    return;
  }
  res.json(reparacion);
};

// DELETE /api/oxigenometros/reparaciones/:id
export const eliminar: RequestHandler = async (req, res) => {
  if (!(await eliminarReparacion(Number(req.params.id)))) {
    res.status(404).json({ error: 'La reparación no existe.' });
    return;
  }
  res.status(204).end();
};

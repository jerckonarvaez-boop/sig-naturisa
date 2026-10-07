import type { RequestHandler } from 'express';
import { obtenerFoto } from './checklist-bp.fotos.js';
import {
  actualizarRevision,
  crearRevision,
  eliminarRevision,
  listarRevisiones,
  obtenerPlantilla,
  obtenerRevision,
} from './checklist-bp.service.js';
import { validarRevision } from './checklist-bp.validator.js';

// GET /api/checklist-bp/plantilla -> requisitos del check list
export const plantilla: RequestHandler = (_req, res) => {
  res.json(obtenerPlantilla());
};

// GET /api/checklist-bp/revisiones
export const listar: RequestHandler = (_req, res) => {
  res.json(listarRevisiones());
};

// GET /api/checklist-bp/revisiones/:id
export const obtener: RequestHandler = (req, res) => {
  const revision = obtenerRevision(Number(req.params.id));
  if (!revision) {
    res.status(404).json({ error: 'La revisión no existe.' });
    return;
  }
  res.json(revision);
};

// POST /api/checklist-bp/revisiones
export const crear: RequestHandler = (req, res) => {
  const resultado = validarRevision(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  res.status(201).json(crearRevision(resultado.datos));
};

// PUT /api/checklist-bp/revisiones/:id
export const actualizar: RequestHandler = (req, res) => {
  const resultado = validarRevision(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  const revision = actualizarRevision(Number(req.params.id), resultado.datos);
  if (!revision) {
    res.status(404).json({ error: 'La revisión no existe.' });
    return;
  }
  res.json(revision);
};

// DELETE /api/checklist-bp/revisiones/:id
export const eliminar: RequestHandler = (req, res) => {
  if (!eliminarRevision(Number(req.params.id))) {
    res.status(404).json({ error: 'La revisión no existe.' });
    return;
  }
  res.status(204).end();
};

// GET /api/checklist-bp/fotos/:id -> imagen (el contenido de un id nunca cambia)
export const foto: RequestHandler = (req, res) => {
  const encontrada = obtenerFoto(Number(req.params.id));
  if (!encontrada) {
    res.status(404).json({ error: 'La foto no existe.' });
    return;
  }
  res.set('Cache-Control', 'private, max-age=31536000, immutable').type(encontrada.tipo).send(Buffer.from(encontrada.datos));
};

import type { RequestHandler } from 'express';
import { listaPorId } from './configuracion.listas.js';
import { guardarLista, listasConValores, restaurarLista, validarValores, valoresLista } from './configuracion.service.js';

// GET /api/configuracion/listas -> todas las listas editables con sus valores vigentes
export const listas: RequestHandler = async (_req, res) => {
  res.json(await listasConValores());
};

// GET /api/configuracion/listas/:id -> valores vigentes de una lista
export const lista: RequestHandler = async (req, res) => {
  const valores = await valoresLista(String(req.params.id));
  if (!valores) {
    res.status(404).json({ error: 'La lista no existe.' });
    return;
  }
  res.json({ valores });
};

// PUT /api/configuracion/listas/:id { valores } -> guarda la lista
export const guardar: RequestHandler = async (req, res) => {
  const def = listaPorId(String(req.params.id));
  if (!def) {
    res.status(404).json({ error: 'La lista no existe.' });
    return;
  }
  const resultado = validarValores(def, req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  await guardarLista(def.id, resultado.datos);
  res.json({ valores: resultado.datos });
};

// DELETE /api/configuracion/listas/:id -> vuelve a los valores de fábrica
export const restaurar: RequestHandler = async (req, res) => {
  const def = listaPorId(String(req.params.id));
  if (!def) {
    res.status(404).json({ error: 'La lista no existe.' });
    return;
  }
  await restaurarLista(def.id);
  res.json({ valores: def.inicial });
};

import type { RequestHandler } from 'express';
import { actualizarEvento, crearEvento, eliminarEvento, listarEventos } from './eventos.service.js';
import { tiposDeConsulta, validarEvento } from './eventos.validator.js';

// GET /api/eventos?tipo=auditoria-asc,auditoria-bap  (sin "tipo" devuelve todos)
export const listar: RequestHandler = async (req, res) => {
  res.json(await listarEventos(tiposDeConsulta(req.query.tipo)));
};

// POST /api/eventos
export const crear: RequestHandler = async (req, res) => {
  const resultado = validarEvento(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  res.status(201).json(await crearEvento(resultado.datos));
};

// PUT /api/eventos/:id
export const actualizar: RequestHandler = async (req, res) => {
  const resultado = validarEvento(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  const evento = await actualizarEvento(Number(req.params.id), resultado.datos);
  if (!evento) {
    res.status(404).json({ error: 'El evento no existe.' });
    return;
  }
  res.json(evento);
};

// DELETE /api/eventos/:id
export const eliminar: RequestHandler = async (req, res) => {
  if (!(await eliminarEvento(Number(req.params.id)))) {
    res.status(404).json({ error: 'El evento no existe.' });
    return;
  }
  res.status(204).end();
};

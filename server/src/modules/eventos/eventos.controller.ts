import type { RequestHandler } from 'express';
import { enviarPrueba, estadoAvisos, guardarConfigAvisos, validarConfigAvisos } from './eventos.avisos.js';
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

// GET /api/eventos/avisos -> destinatarios, días de anticipación y si hay cuenta de envío
export const avisos: RequestHandler = async (_req, res) => {
  res.json(await estadoAvisos());
};

// PUT /api/eventos/avisos { para, dias }
export const cambiarAvisos: RequestHandler = async (req, res) => {
  const resultado = validarConfigAvisos(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  await guardarConfigAvisos(resultado.datos);
  res.json(await estadoAvisos());
};

// POST /api/eventos/avisos/prueba -> envía un correo de prueba a los destinatarios guardados
export const probarAvisos: RequestHandler = async (_req, res) => {
  try {
    res.json(await enviarPrueba());
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
};

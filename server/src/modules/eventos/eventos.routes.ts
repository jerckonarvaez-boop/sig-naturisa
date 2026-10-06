import { Router } from 'express';
import { actualizarEvento, crearEvento, eliminarEvento, listarEventos } from './eventos.service.js';
import { ESTADOS_EVENTO, TIPOS_EVENTO, type EventoDatos, type TipoEvento } from './eventos.types.js';

export const eventosRouter = Router();

// GET /api/eventos?tipo=auditoria-asc,auditoria-bap  (sin "tipo" devuelve todos)
eventosRouter.get('/', (req, res) => {
  const tipos = String(req.query.tipo ?? '')
    .split(',')
    .filter((t): t is TipoEvento => (TIPOS_EVENTO as readonly string[]).includes(t));
  res.json(listarEventos(tipos));
});

// POST /api/eventos
eventosRouter.post('/', (req, res) => {
  const resultado = validarEvento(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  res.status(201).json(crearEvento(resultado.datos));
});

// PUT /api/eventos/:id
eventosRouter.put('/:id', (req, res) => {
  const resultado = validarEvento(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  const evento = actualizarEvento(Number(req.params.id), resultado.datos);
  if (!evento) {
    res.status(404).json({ error: 'El evento no existe.' });
    return;
  }
  res.json(evento);
});

// DELETE /api/eventos/:id
eventosRouter.delete('/:id', (req, res) => {
  if (!eliminarEvento(Number(req.params.id))) {
    res.status(404).json({ error: 'El evento no existe.' });
    return;
  }
  res.status(204).end();
});

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const esFecha = (v: unknown): v is string => typeof v === 'string' && FECHA.test(v) && !Number.isNaN(Date.parse(v));
const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function validarEvento(body: Record<string, unknown> | undefined): { datos: EventoDatos } | { error: string } {
  if (!body) return { error: 'Faltan los datos del evento.' };
  if (!(TIPOS_EVENTO as readonly unknown[]).includes(body.tipo)) return { error: 'Tipo de evento no válido.' };
  if (!(ESTADOS_EVENTO as readonly unknown[]).includes(body.estado)) return { error: 'Estado no válido.' };

  const titulo = texto(body.titulo, 200);
  if (!titulo) return { error: 'El título es obligatorio.' };
  if (!esFecha(body.fechaInicio)) return { error: 'La fecha de inicio no es válida.' };

  const fechaFin = body.fechaFin ? body.fechaFin : null;
  if (fechaFin !== null && !esFecha(fechaFin)) return { error: 'La fecha de fin no es válida.' };
  if (fechaFin && fechaFin < body.fechaInicio) return { error: 'La fecha de fin no puede ser anterior a la de inicio.' };

  return {
    datos: {
      tipo: body.tipo as EventoDatos['tipo'],
      titulo,
      fechaInicio: body.fechaInicio,
      fechaFin: fechaFin && fechaFin !== body.fechaInicio ? fechaFin : null,
      sucursal: texto(body.sucursal, 120),
      responsable: texto(body.responsable, 120),
      estado: body.estado as EventoDatos['estado'],
      observaciones: texto(body.observaciones, 4000),
    },
  };
}

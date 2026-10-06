import { Router } from 'express';
import {
  actualizarRevision,
  crearRevision,
  eliminarRevision,
  listarRevisiones,
  obtenerPlantilla,
  obtenerRevision,
} from './checklist-bp.service.js';
import { RESPUESTAS, type Respuesta, type RevisionDatos } from './checklist-bp.types.js';

export const checklistBpRouter = Router();

// GET /api/checklist-bp/plantilla -> requisitos del check list
checklistBpRouter.get('/plantilla', (_req, res) => {
  res.json(obtenerPlantilla());
});

// GET /api/checklist-bp/revisiones
checklistBpRouter.get('/revisiones', (_req, res) => {
  res.json(listarRevisiones());
});

// GET /api/checklist-bp/revisiones/:id
checklistBpRouter.get('/revisiones/:id', (req, res) => {
  const revision = obtenerRevision(Number(req.params.id));
  if (!revision) {
    res.status(404).json({ error: 'La revisión no existe.' });
    return;
  }
  res.json(revision);
});

// POST /api/checklist-bp/revisiones
checklistBpRouter.post('/revisiones', (req, res) => {
  const resultado = validar(req.body);
  if ('error' in resultado) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  res.status(201).json(crearRevision(resultado.datos));
});

// PUT /api/checklist-bp/revisiones/:id
checklistBpRouter.put('/revisiones/:id', (req, res) => {
  const resultado = validar(req.body);
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
});

// DELETE /api/checklist-bp/revisiones/:id
checklistBpRouter.delete('/revisiones/:id', (req, res) => {
  if (!eliminarRevision(Number(req.params.id))) {
    res.status(404).json({ error: 'La revisión no existe.' });
    return;
  }
  res.status(204).end();
});

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function validar(body: Record<string, unknown> | undefined): { datos: RevisionDatos } | { error: string } {
  if (!body) return { error: 'Faltan los datos de la revisión.' };
  const fecha = body.fecha;
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) {
    return { error: 'La fecha no es válida.' };
  }
  const sucursal = texto(body.sucursal, 120);
  if (!sucursal) return { error: 'La sucursal es obligatoria.' };
  if (!Array.isArray(body.respuestas)) return { error: 'Faltan las respuestas.' };

  const respuestas: RevisionDatos['respuestas'] = [];
  for (const r of body.respuestas as Record<string, unknown>[]) {
    if (!Number.isInteger(r?.itemId)) return { error: 'Hay una respuesta sin requisito.' };
    if (r.respuesta != null && !(RESPUESTAS as readonly unknown[]).includes(r.respuesta)) {
      return { error: `Respuesta no válida en el requisito ${r.itemId}.` };
    }
    respuestas.push({
      itemId: r.itemId as number,
      respuesta: (r.respuesta as Respuesta | null) ?? null,
      observacion: texto(r.observacion, 1000),
    });
  }

  return {
    datos: {
      fecha,
      sucursal,
      responsable: texto(body.responsable, 120),
      observaciones: texto(body.observaciones, 4000),
      respuestas,
    },
  };
}

import { Router } from 'express';
import {
  actualizarRevision,
  crearRevision,
  eliminarRevision,
  listarRevisiones,
  obtenerFoto,
  obtenerPlantilla,
  obtenerRevision,
} from './checklist-bp.service.js';
import {
  MAX_FOTOS_POR_ITEM,
  RESPUESTAS,
  TIPOS_FOTO,
  type FotoEntrada,
  type Respuesta,
  type RevisionDatos,
} from './checklist-bp.types.js';

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

// GET /api/checklist-bp/fotos/:id -> imagen (el contenido de un id nunca cambia)
checklistBpRouter.get('/fotos/:id', (req, res) => {
  const foto = obtenerFoto(Number(req.params.id));
  if (!foto) {
    res.status(404).json({ error: 'La foto no existe.' });
    return;
  }
  res.set('Cache-Control', 'private, max-age=31536000, immutable').type(foto.tipo).send(Buffer.from(foto.datos));
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
    const fotos = validarFotos(r.fotos);
    if ('error' in fotos) return { error: `${fotos.error} (requisito ${r.itemId}).` };
    respuestas.push({
      itemId: r.itemId as number,
      respuesta: (r.respuesta as Respuesta | null) ?? null,
      observacion: texto(r.observacion, 1000),
      fotos: fotos.fotos,
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

const MAX_BYTES_FOTO = 3 * 1024 * 1024;

/** Cada foto es { id } (ya guardada) o { datos: "data:image/jpeg;base64,..." } (nueva) */
function validarFotos(valor: unknown): { fotos: FotoEntrada[] } | { error: string } {
  if (valor == null) return { fotos: [] };
  if (!Array.isArray(valor)) return { error: 'Las fotos no son válidas' };
  if (valor.length > MAX_FOTOS_POR_ITEM) return { error: `Máximo ${MAX_FOTOS_POR_ITEM} fotos por requisito` };

  const fotos: FotoEntrada[] = [];
  for (const f of valor as Record<string, unknown>[]) {
    if (Number.isInteger(f?.id)) {
      fotos.push({ id: f.id as number });
      continue;
    }
    const partes = typeof f?.datos === 'string' ? /^data:([\w/+.-]+);base64,(.+)$/.exec(f.datos) : null;
    if (!partes || !(TIPOS_FOTO as readonly string[]).includes(partes[1])) return { error: 'Formato de foto no admitido' };
    const datos = Buffer.from(partes[2], 'base64');
    if (datos.length > MAX_BYTES_FOTO) return { error: 'Una foto supera los 3 MB' };
    fotos.push({ tipo: partes[1], datos });
  }
  return { fotos };
}

import type { RequestHandler } from 'express';
import { importarPresupuesto, obtenerCatalogo, obtenerPresupuesto } from './presupuesto.service.js';
import { validarImportacion } from './presupuesto.validator.js';

// GET /api/presupuesto -> todos los datos del presupuesto (gastos + montos presupuestados)
export const obtener: RequestHandler = async (_req, res) => {
  res.json(await obtenerPresupuesto());
};

// POST /api/presupuesto/importar -> reemplaza los datos con los leídos del Excel
export const importar: RequestHandler = async (req, res) => {
  const error = validarImportacion(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  res.status(201).json(await importarPresupuesto(req.body));
};

// GET /api/presupuesto/catalogo -> ítems con precio y centros de costo (listas para otros módulos)
export const catalogo: RequestHandler = async (_req, res) => {
  res.json(await obtenerCatalogo());
};

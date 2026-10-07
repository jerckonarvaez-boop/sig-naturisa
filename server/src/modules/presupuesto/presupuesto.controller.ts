import type { RequestHandler } from 'express';
import { importarPresupuesto, obtenerPresupuesto } from './presupuesto.service.js';
import { validarImportacion } from './presupuesto.validator.js';

// GET /api/presupuesto -> todos los datos del presupuesto (gastos + montos presupuestados)
export const obtener: RequestHandler = (_req, res) => {
  res.json(obtenerPresupuesto());
};

// POST /api/presupuesto/importar -> reemplaza los datos con los leídos del Excel
export const importar: RequestHandler = (req, res) => {
  const error = validarImportacion(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  res.status(201).json(importarPresupuesto(req.body));
};

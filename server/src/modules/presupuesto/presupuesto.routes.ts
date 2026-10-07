// Presupuesto vs. gasto: /api/presupuesto
import { Router } from 'express';
import { importar, obtener } from './presupuesto.controller.js';

export const presupuestoRouter = Router();

presupuestoRouter.get('/', obtener);
presupuestoRouter.post('/importar', importar);

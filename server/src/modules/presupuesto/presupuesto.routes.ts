// Presupuesto vs. gasto: /api/presupuesto
import { Router } from 'express';
import { catalogo, importar, obtener } from './presupuesto.controller.js';

export const presupuestoRouter = Router();

presupuestoRouter.get('/', obtener);
presupuestoRouter.get('/catalogo', catalogo);
presupuestoRouter.post('/importar', importar);

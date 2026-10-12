// Laboratorios ▸ Oxigenómetros (reparaciones y ahorro): /api/oxigenometros
import { Router } from 'express';
import { actualizar, crear, eliminar, listar } from './oxigenometros.controller.js';

export const oxigenometrosRouter = Router();

oxigenometrosRouter.get('/reparaciones', listar);
oxigenometrosRouter.post('/reparaciones', crear);
oxigenometrosRouter.put('/reparaciones/:id', actualizar);
oxigenometrosRouter.delete('/reparaciones/:id', eliminar);

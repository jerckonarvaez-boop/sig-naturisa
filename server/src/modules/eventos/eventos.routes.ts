// Calendario de eventos (auditorías ASC/BAP e inspecciones SCI): /api/eventos
import { Router } from 'express';
import { actualizar, crear, eliminar, listar } from './eventos.controller.js';

export const eventosRouter = Router();

eventosRouter.get('/', listar);
eventosRouter.post('/', crear);
eventosRouter.put('/:id', actualizar);
eventosRouter.delete('/:id', eliminar);

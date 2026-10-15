// Calendario general de eventos (auditorías, inspecciones, capacitaciones…) y sus avisos por correo: /api/eventos
import { Router } from 'express';
import { actualizar, avisos, cambiarAvisos, cambiarClaveFeed, crear, eliminar, listar, probarAvisos } from './eventos.controller.js';

export const eventosRouter = Router();

// Avisos por correo (antes de /:id)
eventosRouter.get('/avisos', avisos);
eventosRouter.put('/avisos', cambiarAvisos);
eventosRouter.post('/avisos/prueba', probarAvisos);
eventosRouter.post('/avisos/clave', cambiarClaveFeed);

eventosRouter.get('/', listar);
eventosRouter.post('/', crear);
eventosRouter.put('/:id', actualizar);
eventosRouter.delete('/:id', eliminar);

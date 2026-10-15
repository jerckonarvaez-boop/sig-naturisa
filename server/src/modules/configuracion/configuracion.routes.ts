// Configuración editable por el usuario (listas de valores): /api/configuracion
import { Router } from 'express';
import { guardar, lista, listas, restaurar } from './configuracion.controller.js';

export const configuracionRouter = Router();

configuracionRouter.get('/listas', listas);
configuracionRouter.get('/listas/:id', lista);
configuracionRouter.put('/listas/:id', guardar);
configuracionRouter.delete('/listas/:id', restaurar);

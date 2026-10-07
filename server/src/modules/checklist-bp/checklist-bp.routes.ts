// Check list de Buenas Prácticas (revisión previa a la inspección SCI): /api/checklist-bp
import { Router } from 'express';
import { actualizar, crear, eliminar, foto, listar, obtener, plantilla } from './checklist-bp.controller.js';

export const checklistBpRouter = Router();

checklistBpRouter.get('/plantilla', plantilla);
checklistBpRouter.get('/revisiones', listar);
checklistBpRouter.get('/revisiones/:id', obtener);
checklistBpRouter.post('/revisiones', crear);
checklistBpRouter.put('/revisiones/:id', actualizar);
checklistBpRouter.delete('/revisiones/:id', eliminar);
checklistBpRouter.get('/fotos/:id', foto);

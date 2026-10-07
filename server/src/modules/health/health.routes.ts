// Estado del sistema: /api/health (GET /api/health es además público, ver app.ts)
import { Router } from 'express';
import { direccionesRed, estadoSalud } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', estadoSalud);
healthRouter.get('/red', direccionesRed);

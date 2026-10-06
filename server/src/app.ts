import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './modules/health/health.routes.js';
import { checklistBpRouter } from './modules/checklist-bp/checklist-bp.routes.js';
import { eventosRouter } from './modules/eventos/eventos.routes.js';
import { presupuestoRouter } from './modules/presupuesto/presupuesto.routes.js';
import { errorHandler, notFound } from './shared/middlewares.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  // Límite amplio para permitir importaciones de Excel con miles de filas
  app.use(express.json({ limit: '20mb' }));

  // Rutas por módulo. Cada módulo nuevo se registra aquí, por ejemplo:
  // app.use('/api/auditorias', auditoriasRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/presupuesto', presupuestoRouter);
  app.use('/api/eventos', eventosRouter);
  app.use('/api/checklist-bp', checklistBpRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

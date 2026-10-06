import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter, requiereSesion } from './modules/auth/auth.js';
import { estadoSalud, healthRouter } from './modules/health/health.routes.js';
import { checklistBpRouter } from './modules/checklist-bp/checklist-bp.routes.js';
import { eventosRouter } from './modules/eventos/eventos.routes.js';
import { presupuestoRouter } from './modules/presupuesto/presupuesto.routes.js';
import { errorHandler, notFound } from './shared/middlewares.js';

// Web compilada (client/dist). Existe solo en producción, tras `npm run build`.
const WEB_DIR = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function createApp() {
  const app = express();

  // Detrás del proxy HTTPS del hosting: necesario para cookies seguras y la IP real
  app.set('trust proxy', 1);
  app.use(cors({ origin: env.corsOrigin }));
  // Límite amplio para permitir importaciones de Excel con miles de filas
  app.use(express.json({ limit: '20mb' }));

  // Rutas públicas
  app.use('/api/auth', authRouter);
  app.get('/api/health', estadoSalud);

  // A partir de aquí, toda la API requiere sesión (si APP_PASSWORD está definida)
  app.use('/api', requiereSesion);

  // Rutas por módulo. Cada módulo nuevo se registra aquí, por ejemplo:
  // app.use('/api/auditorias', auditoriasRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/presupuesto', presupuestoRouter);
  app.use('/api/eventos', eventosRouter);
  app.use('/api/checklist-bp', checklistBpRouter);

  // En producción el mismo servidor entrega la web; cualquier ruta que no sea /api abre la app
  if (existsSync(WEB_DIR)) {
    app.use(express.static(WEB_DIR));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile('index.html', { root: WEB_DIR });
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

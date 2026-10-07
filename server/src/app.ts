import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errores.js';
import { requiereSesion } from './middleware/requiereSesion.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { estadoSalud } from './modules/health/health.controller.js';
import { MODULOS_API } from './modules/index.js';

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

  // A partir de aquí, toda la API requiere sesión (salvo AUTH_DISABLED=true)
  app.use('/api', requiereSesion);

  // Módulos de la API (registro en modules/index.ts)
  for (const { ruta, router } of MODULOS_API) app.use(`/api${ruta}`, router);

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

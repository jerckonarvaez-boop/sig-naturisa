import { networkInterfaces } from 'node:os';
import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { isDatabaseConnected } from '../../db/database.js';

// GET /api/health -> estado de la API y de la base de datos (público: lo usa el hosting para vigilar la app)
export const estadoSalud: RequestHandler = (_req, res) => {
  res.json({
    api: 'ok',
    database: isDatabaseConnected() ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
  });
};

// GET /api/health/red -> direcciones para abrir la web desde otro dispositivo de la misma red
export const direccionesRed: RequestHandler = (_req, res) => {
  const urls = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254.'))
    .map((i) => `http://${i!.address}:${env.webPort}`);
  res.json({ urls });
};

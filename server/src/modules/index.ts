import type { Router } from 'express';
import { checklistBpRouter } from './checklist-bp/checklist-bp.routes.js';
import { configuracionRouter } from './configuracion/configuracion.routes.js';
import { eventosRouter } from './eventos/eventos.routes.js';
import { healthRouter } from './health/health.routes.js';
import { laboratorioRouter } from './laboratorio/laboratorio.routes.js';
import { oxigenometrosRouter } from './oxigenometros/oxigenometros.routes.js';
import { presupuestoRouter } from './presupuesto/presupuesto.routes.js';

/**
 * Registro central de los módulos de la API protegidos con sesión (se montan en /api + ruta).
 * Para agregar un módulo: crea su carpeta en modules/ (routes, controller, service, validator,
 * types) y añádelo aquí. Las rutas públicas (auth y GET /api/health) se montan en app.ts.
 */
export const MODULOS_API: { ruta: string; router: Router }[] = [
  { ruta: '/health', router: healthRouter },
  { ruta: '/presupuesto', router: presupuestoRouter },
  { ruta: '/eventos', router: eventosRouter },
  { ruta: '/checklist-bp', router: checklistBpRouter },
  { ruta: '/oxigenometros', router: oxigenometrosRouter },
  { ruta: '/laboratorio', router: laboratorioRouter },
  { ruta: '/configuracion', router: configuracionRouter },
];

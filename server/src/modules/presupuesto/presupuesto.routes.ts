import { Router } from 'express';
import { importarPresupuesto, obtenerPresupuesto } from './presupuesto.service.js';
import type { ImportarPresupuestoBody } from './presupuesto.types.js';

export const presupuestoRouter = Router();

// GET /api/presupuesto -> todos los datos del presupuesto (gastos + montos presupuestados)
presupuestoRouter.get('/', (_req, res) => {
  res.json(obtenerPresupuesto());
});

// POST /api/presupuesto/importar -> reemplaza los datos con los leídos del Excel
presupuestoRouter.post('/importar', (req, res) => {
  const error = validarImportacion(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  res.status(201).json(importarPresupuesto(req.body));
});

function validarImportacion(body: Partial<ImportarPresupuestoBody> | undefined): string | null {
  if (!body || typeof body.archivo !== 'string' || !body.archivo.trim()) return 'Falta el nombre del archivo.';
  if (!Array.isArray(body.gastos) || body.gastos.length === 0) return 'El Excel no contiene gastos.';
  if (!Array.isArray(body.presupuestoArea)) return 'Falta el presupuesto por área.';
  if (!Array.isArray(body.presupuestoSubarea)) return 'Falta el presupuesto por sub-área.';

  const gastoInvalido = body.gastos.findIndex(
    (g) => typeof g?.area !== 'string' || !Number.isFinite(g.total) || !Number.isFinite(g.cantidad),
  );
  if (gastoInvalido >= 0) return `El gasto #${gastoInvalido + 1} tiene datos inválidos (área, cantidad o total).`;

  const montoInvalido = [...body.presupuestoArea, ...body.presupuestoSubarea].some(
    (p) => typeof p?.area !== 'string' || !Number.isFinite(p.monto),
  );
  if (montoInvalido) return 'Hay montos de presupuesto inválidos.';

  return null;
}

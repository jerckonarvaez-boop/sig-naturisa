import type { ImportarPresupuestoBody } from './presupuesto.types.js';

/** Devuelve el mensaje de error, o null si los datos leídos del Excel son válidos */
export function validarImportacion(body: Partial<ImportarPresupuestoBody> | undefined): string | null {
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

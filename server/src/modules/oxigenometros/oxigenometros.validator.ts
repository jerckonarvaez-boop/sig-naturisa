import { esFecha, esUnoDe, texto, type Validado } from '../../utils/validacion.js';
import { ESTADOS_REPARACION, type ReparacionDatos } from './oxigenometros.types.js';

const MAX_MONTO = 10_000_000;

/** Monto en USD (0 a 10 millones) redondeado a centavos, o null si no es válido */
const monto = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_MONTO ? Math.round(v * 100) / 100 : null;

export function validarReparacion(body: Record<string, unknown> | undefined): Validado<ReparacionDatos> {
  if (!body) return { error: 'Faltan los datos de la reparación.' };
  if (!esFecha(body.fecha)) return { error: 'La fecha no es válida.' };
  const parte = texto(body.parte, 120);
  if (!parte) return { error: 'Indique la parte reparada.' };
  const cantidad = body.cantidad;
  if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 1000) {
    return { error: 'La cantidad debe ser un número entero entre 1 y 1000.' };
  }
  const precioNuevo = monto(body.precioNuevo);
  if (precioNuevo === null) return { error: 'El precio de la parte nueva no es válido.' };
  if (!esUnoDe(ESTADOS_REPARACION, body.estado)) return { error: 'Estado no válido.' };

  return {
    datos: {
      fecha: body.fecha,
      parte,
      cantidad,
      equipo: texto(body.equipo, 120),
      sucursal: texto(body.sucursal, 120),
      trabajo: texto(body.trabajo, 1000),
      precioNuevo,
      estado: body.estado,
      responsable: texto(body.responsable, 120),
      observaciones: texto(body.observaciones, 2000),
    },
  };
}

import { esFecha, esUnoDe, texto, type Validado } from '../../utils/validacion.js';
import { ESTADOS_EVENTO, TIPOS_EVENTO, type EventoDatos, type TipoEvento } from './eventos.types.js';

/** Tipos pedidos en ?tipo=a,b (los no reconocidos se ignoran) */
export const tiposDeConsulta = (valor: unknown): TipoEvento[] =>
  String(valor ?? '')
    .split(',')
    .filter((t): t is TipoEvento => esUnoDe(TIPOS_EVENTO, t));

export function validarEvento(body: Record<string, unknown> | undefined): Validado<EventoDatos> {
  if (!body) return { error: 'Faltan los datos del evento.' };
  if (!esUnoDe(TIPOS_EVENTO, body.tipo)) return { error: 'Tipo de evento no válido.' };
  if (!esUnoDe(ESTADOS_EVENTO, body.estado)) return { error: 'Estado no válido.' };

  const titulo = texto(body.titulo, 200);
  if (!titulo) return { error: 'El título es obligatorio.' };
  if (!esFecha(body.fechaInicio)) return { error: 'La fecha de inicio no es válida.' };

  const fechaFin = body.fechaFin ? body.fechaFin : null;
  if (fechaFin !== null && !esFecha(fechaFin)) return { error: 'La fecha de fin no es válida.' };
  if (fechaFin && fechaFin < body.fechaInicio) return { error: 'La fecha de fin no puede ser anterior a la de inicio.' };

  return {
    datos: {
      tipo: body.tipo,
      titulo,
      fechaInicio: body.fechaInicio,
      fechaFin: fechaFin && fechaFin !== body.fechaInicio ? fechaFin : null,
      sucursal: texto(body.sucursal, 120),
      responsable: texto(body.responsable, 120),
      estado: body.estado,
      observaciones: texto(body.observaciones, 4000),
    },
  };
}

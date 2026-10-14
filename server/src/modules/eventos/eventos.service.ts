import { consultar, consultarUna, ejecutar, type Fila } from '../../db/database.js';
import type { EstadoEvento, Evento, EventoDatos, TipoEvento } from './eventos.types.js';

const COLUMNAS = `id, tipo, titulo, fecha_inicio, fecha_fin, sucursal, responsable, estado, observaciones,
                  avisar, aviso_enviado_en, creado_en, actualizado_en`;

function aEvento(r: Fila): Evento {
  return {
    id: Number(r.id),
    tipo: String(r.tipo) as TipoEvento,
    titulo: String(r.titulo),
    fechaInicio: String(r.fecha_inicio),
    fechaFin: r.fecha_fin ? String(r.fecha_fin) : null,
    sucursal: String(r.sucursal ?? ''),
    responsable: String(r.responsable ?? ''),
    estado: String(r.estado) as EstadoEvento,
    observaciones: String(r.observaciones ?? ''),
    avisar: Number(r.avisar) === 1,
    avisoEnviadoEn: r.aviso_enviado_en ? String(r.aviso_enviado_en) : null,
    creadoEn: String(r.creado_en),
    actualizadoEn: String(r.actualizado_en),
  };
}

/** Lista los eventos de los tipos indicados (todos si no se indica ninguno), por fecha. */
export async function listarEventos(tipos: TipoEvento[]): Promise<Evento[]> {
  const filtro = tipos.length ? `WHERE tipo IN (${tipos.map(() => '?').join(', ')})` : '';
  return (await consultar(`SELECT ${COLUMNAS} FROM evento ${filtro} ORDER BY fecha_inicio, id`, tipos)).map(aEvento);
}

export async function obtenerEvento(id: number): Promise<Evento | null> {
  const fila = await consultarUna(`SELECT ${COLUMNAS} FROM evento WHERE id = ?`, [id]);
  return fila ? aEvento(fila) : null;
}

export async function crearEvento(d: EventoDatos): Promise<Evento> {
  const { id } = await ejecutar(
    `INSERT INTO evento (tipo, titulo, fecha_inicio, fecha_fin, sucursal, responsable, estado, observaciones, avisar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.tipo, d.titulo, d.fechaInicio, d.fechaFin, d.sucursal, d.responsable, d.estado, d.observaciones, d.avisar ? 1 : 0],
  );
  return (await obtenerEvento(id))!;
}

/**
 * Si cambia la fecha de inicio (reprogramación) o se desactiva el aviso, el aviso vuelve a quedar
 * pendiente (en el SET, fecha_inicio todavía es la fecha anterior).
 */
export async function actualizarEvento(id: number, d: EventoDatos): Promise<Evento | null> {
  const avisar = d.avisar ? 1 : 0;
  const { cambios } = await ejecutar(
    `UPDATE evento SET tipo = ?, titulo = ?, fecha_inicio = ?, fecha_fin = ?, sucursal = ?, responsable = ?,
       estado = ?, observaciones = ?, avisar = ?,
       aviso_enviado_en = CASE WHEN fecha_inicio <> ? OR ? = 0 THEN NULL ELSE aviso_enviado_en END,
       actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
     WHERE id = ?`,
    [d.tipo, d.titulo, d.fechaInicio, d.fechaFin, d.sucursal, d.responsable, d.estado, d.observaciones, avisar, d.fechaInicio, avisar, id],
  );
  return cambios ? obtenerEvento(id) : null;
}

export async function eliminarEvento(id: number): Promise<boolean> {
  return (await ejecutar('DELETE FROM evento WHERE id = ?', [id])).cambios > 0;
}

/** Eventos con aviso pendiente que empiezan entre `desde` y `hasta` (programados o reprogramados) */
export async function eventosPorAvisar(desde: string, hasta: string): Promise<Evento[]> {
  const filas = await consultar(
    `SELECT ${COLUMNAS} FROM evento
     WHERE avisar = 1 AND aviso_enviado_en IS NULL AND estado IN ('programado', 'reprogramado')
       AND fecha_inicio BETWEEN ? AND ?
     ORDER BY fecha_inicio, id`,
    [desde, hasta],
  );
  return filas.map(aEvento);
}

/** Próximos eventos programados (para el correo de prueba), se hayan avisado o no */
export async function proximosEventos(desde: string, hasta: string): Promise<Evento[]> {
  const filas = await consultar(
    `SELECT ${COLUMNAS} FROM evento
     WHERE estado IN ('programado', 'reprogramado') AND fecha_inicio BETWEEN ? AND ?
     ORDER BY fecha_inicio, id`,
    [desde, hasta],
  );
  return filas.map(aEvento);
}

export async function marcarAvisados(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await ejecutar(
    `UPDATE evento SET aviso_enviado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id IN (${ids.map(() => '?').join(', ')})`,
    ids,
  );
}

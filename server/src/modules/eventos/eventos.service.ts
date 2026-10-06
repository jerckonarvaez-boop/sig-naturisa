import { db } from '../../db/database.js';
import type { EstadoEvento, Evento, EventoDatos, TipoEvento } from './eventos.types.js';

const COLUMNAS = `id, tipo, titulo, fecha_inicio, fecha_fin, sucursal, responsable, estado, observaciones,
                  creado_en, actualizado_en`;

function aEvento(r: Record<string, unknown>): Evento {
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
    creadoEn: String(r.creado_en),
    actualizadoEn: String(r.actualizado_en),
  };
}

/** Lista los eventos de los tipos indicados (todos si no se indica ninguno), por fecha. */
export function listarEventos(tipos: TipoEvento[]): Evento[] {
  const filtro = tipos.length ? `WHERE tipo IN (${tipos.map(() => '?').join(', ')})` : '';
  return db
    .prepare(`SELECT ${COLUMNAS} FROM evento ${filtro} ORDER BY fecha_inicio, id`)
    .all(...tipos)
    .map(aEvento);
}

export function obtenerEvento(id: number): Evento | null {
  const fila = db.prepare(`SELECT ${COLUMNAS} FROM evento WHERE id = ?`).get(id);
  return fila ? aEvento(fila) : null;
}

export function crearEvento(d: EventoDatos): Evento {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO evento (tipo, titulo, fecha_inicio, fecha_fin, sucursal, responsable, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(d.tipo, d.titulo, d.fechaInicio, d.fechaFin, d.sucursal, d.responsable, d.estado, d.observaciones);
  return obtenerEvento(Number(lastInsertRowid))!;
}

export function actualizarEvento(id: number, d: EventoDatos): Evento | null {
  const { changes } = db
    .prepare(
      `UPDATE evento SET tipo = ?, titulo = ?, fecha_inicio = ?, fecha_fin = ?, sucursal = ?, responsable = ?,
         estado = ?, observaciones = ?, actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
       WHERE id = ?`,
    )
    .run(d.tipo, d.titulo, d.fechaInicio, d.fechaFin, d.sucursal, d.responsable, d.estado, d.observaciones, id);
  return changes ? obtenerEvento(id) : null;
}

export function eliminarEvento(id: number): boolean {
  return db.prepare('DELETE FROM evento WHERE id = ?').run(id).changes > 0;
}

import { consultar, consultarUna, ejecutar, type Fila } from '../../db/database.js';
import type { EstadoEvento, Evento, EventoDatos, TipoEvento } from './eventos.types.js';

const COLUMNAS = `id, tipo, titulo, fecha_inicio, fecha_fin, sucursal, responsable, estado, observaciones,
                  creado_en, actualizado_en`;

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
    `INSERT INTO evento (tipo, titulo, fecha_inicio, fecha_fin, sucursal, responsable, estado, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.tipo, d.titulo, d.fechaInicio, d.fechaFin, d.sucursal, d.responsable, d.estado, d.observaciones],
  );
  return (await obtenerEvento(id))!;
}

export async function actualizarEvento(id: number, d: EventoDatos): Promise<Evento | null> {
  const { cambios } = await ejecutar(
    `UPDATE evento SET tipo = ?, titulo = ?, fecha_inicio = ?, fecha_fin = ?, sucursal = ?, responsable = ?,
       estado = ?, observaciones = ?, actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
     WHERE id = ?`,
    [d.tipo, d.titulo, d.fechaInicio, d.fechaFin, d.sucursal, d.responsable, d.estado, d.observaciones, id],
  );
  return cambios ? obtenerEvento(id) : null;
}

export async function eliminarEvento(id: number): Promise<boolean> {
  return (await ejecutar('DELETE FROM evento WHERE id = ?', [id])).cambios > 0;
}

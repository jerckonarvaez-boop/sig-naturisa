import { consultar, consultarUna, ejecutar, type Fila } from '../../db/database.js';
import type { EstadoReparacion, Reparacion, ReparacionDatos } from './oxigenometros.types.js';

const COLUMNAS = `id, fecha, parte, cantidad, equipo, sucursal, trabajo, precio_nuevo, estado,
                  responsable, observaciones, creado_en, actualizado_en`;

function aReparacion(r: Fila): Reparacion {
  return {
    id: Number(r.id),
    fecha: String(r.fecha),
    parte: String(r.parte),
    cantidad: Number(r.cantidad),
    equipo: String(r.equipo ?? ''),
    sucursal: String(r.sucursal ?? ''),
    trabajo: String(r.trabajo ?? ''),
    precioNuevo: Number(r.precio_nuevo),
    estado: String(r.estado) as EstadoReparacion,
    responsable: String(r.responsable ?? ''),
    observaciones: String(r.observaciones ?? ''),
    creadoEn: String(r.creado_en),
    actualizadoEn: String(r.actualizado_en),
  };
}

const valores = (d: ReparacionDatos) => [
  d.fecha, d.parte, d.cantidad, d.equipo, d.sucursal, d.trabajo, d.precioNuevo, d.estado,
  d.responsable, d.observaciones,
];

/** Todas las reparaciones, de la más reciente a la más antigua */
export async function listarReparaciones(): Promise<Reparacion[]> {
  return (await consultar(`SELECT ${COLUMNAS} FROM oxigenometro_reparacion ORDER BY fecha DESC, id DESC`)).map(aReparacion);
}

export async function obtenerReparacion(id: number): Promise<Reparacion | null> {
  const fila = await consultarUna(`SELECT ${COLUMNAS} FROM oxigenometro_reparacion WHERE id = ?`, [id]);
  return fila ? aReparacion(fila) : null;
}

export async function crearReparacion(d: ReparacionDatos): Promise<Reparacion> {
  const { id } = await ejecutar(
    `INSERT INTO oxigenometro_reparacion (fecha, parte, cantidad, equipo, sucursal, trabajo, precio_nuevo,
       estado, responsable, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    valores(d),
  );
  return (await obtenerReparacion(id))!;
}

export async function actualizarReparacion(id: number, d: ReparacionDatos): Promise<Reparacion | null> {
  const { cambios } = await ejecutar(
    `UPDATE oxigenometro_reparacion SET fecha = ?, parte = ?, cantidad = ?, equipo = ?, sucursal = ?, trabajo = ?,
       precio_nuevo = ?, estado = ?, responsable = ?, observaciones = ?,
       actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
     WHERE id = ?`,
    [...valores(d), id],
  );
  return cambios ? obtenerReparacion(id) : null;
}

export async function eliminarReparacion(id: number): Promise<boolean> {
  return (await ejecutar('DELETE FROM oxigenometro_reparacion WHERE id = ?', [id])).cambios > 0;
}

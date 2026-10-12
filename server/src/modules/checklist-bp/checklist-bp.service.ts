import type { InStatement } from '@libsql/client';
import { consultar, consultarUna, ejecutar, lote, transaction, type Fila } from '../../db/database.js';
import { fotosDe, sentenciasFotos } from './checklist-bp.fotos.js';
import type { ItemChecklist, Respuesta, RespuestaItem, Revision, RevisionDatos } from './checklist-bp.types.js';

/** Requisitos vigentes de la plantilla, en orden */
export async function obtenerPlantilla(): Promise<ItemChecklist[]> {
  const filas = await consultar(
    'SELECT id, seccion, seccion_orden, numero, requerimiento FROM checklist_bp_item WHERE activo = 1 ORDER BY seccion_orden, numero',
  );
  return filas.map((r) => ({
    id: Number(r.id),
    seccion: String(r.seccion),
    seccionOrden: Number(r.seccion_orden),
    numero: Number(r.numero),
    requerimiento: String(r.requerimiento),
  }));
}

async function respuestasDe(revisionIds: number[]): Promise<Map<number, RespuestaItem[]>> {
  const mapa = new Map<number, RespuestaItem[]>(revisionIds.map((id) => [id, []]));
  if (!revisionIds.length) return mapa;
  const [fotos, filas] = await Promise.all([
    fotosDe(revisionIds),
    consultar(
      `SELECT revision_id, item_id, seccion, numero, requerimiento, respuesta, observacion
       FROM checklist_bp_respuesta WHERE revision_id IN (${revisionIds.map(() => '?').join(', ')})
       ORDER BY numero`,
      revisionIds,
    ),
  ]);
  for (const r of filas) {
    mapa.get(Number(r.revision_id))?.push({
      itemId: Number(r.item_id),
      seccion: String(r.seccion),
      numero: Number(r.numero),
      requerimiento: String(r.requerimiento),
      respuesta: r.respuesta ? (String(r.respuesta) as Respuesta) : null,
      observacion: String(r.observacion ?? ''),
      fotos: fotos.get(`${r.revision_id}-${r.item_id}`) ?? [],
    });
  }
  return mapa;
}

function aRevision(r: Fila, respuestas: RespuestaItem[]): Revision {
  return {
    id: Number(r.id),
    fecha: String(r.fecha),
    sucursal: String(r.sucursal),
    responsable: String(r.responsable ?? ''),
    observaciones: String(r.observaciones ?? ''),
    creadoEn: String(r.creado_en),
    actualizadoEn: String(r.actualizado_en),
    respuestas,
  };
}

const COLUMNAS = 'id, fecha, sucursal, responsable, observaciones, creado_en, actualizado_en';

/** Todas las revisiones (más recientes primero), con sus respuestas */
export async function listarRevisiones(): Promise<Revision[]> {
  const filas = await consultar(`SELECT ${COLUMNAS} FROM checklist_bp_revision ORDER BY fecha DESC, id DESC`);
  const respuestas = await respuestasDe(filas.map((f) => Number(f.id)));
  return filas.map((f) => aRevision(f, respuestas.get(Number(f.id)) ?? []));
}

export async function obtenerRevision(id: number): Promise<Revision | null> {
  const fila = await consultarUna(`SELECT ${COLUMNAS} FROM checklist_bp_revision WHERE id = ?`, [id]);
  return fila ? aRevision(fila, (await respuestasDe([id])).get(id) ?? []) : null;
}

/** Sentencias que reemplazan las respuestas, copiando el texto vigente de cada requisito */
function sentenciasRespuestas(revisionId: number, respuestas: RevisionDatos['respuestas']): InStatement[] {
  return [
    { sql: 'DELETE FROM checklist_bp_respuesta WHERE revision_id = ?', args: [revisionId] },
    ...respuestas.map((r) => ({
      sql: `INSERT INTO checklist_bp_respuesta (revision_id, item_id, seccion, numero, requerimiento, respuesta, observacion)
            SELECT ?, id, seccion, numero, requerimiento, ?, ? FROM checklist_bp_item WHERE id = ?`,
      args: [revisionId, r.respuesta, r.observacion, r.itemId],
    })),
  ];
}

export async function crearRevision(d: RevisionDatos): Promise<Revision> {
  const id = await transaction(async (tx) => {
    const { id: nuevoId } = await ejecutar(
      'INSERT INTO checklist_bp_revision (fecha, sucursal, responsable, observaciones) VALUES (?, ?, ?, ?)',
      [d.fecha, d.sucursal, d.responsable, d.observaciones],
      tx,
    );
    await lote([...sentenciasRespuestas(nuevoId, d.respuestas), ...sentenciasFotos(nuevoId, d.respuestas)], tx);
    return nuevoId;
  });
  return (await obtenerRevision(id))!;
}

export async function actualizarRevision(id: number, d: RevisionDatos): Promise<Revision | null> {
  const existe = await transaction(async (tx) => {
    const { cambios } = await ejecutar(
      `UPDATE checklist_bp_revision SET fecha = ?, sucursal = ?, responsable = ?, observaciones = ?,
         actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?`,
      [d.fecha, d.sucursal, d.responsable, d.observaciones, id],
      tx,
    );
    if (cambios) await lote([...sentenciasRespuestas(id, d.respuestas), ...sentenciasFotos(id, d.respuestas)], tx);
    return cambios > 0;
  });
  return existe ? obtenerRevision(id) : null;
}

/** Elimina la revisión con sus respuestas y fotos (todo o nada) */
export async function eliminarRevision(id: number): Promise<boolean> {
  const afectadas = await lote([
    { sql: 'DELETE FROM checklist_bp_foto WHERE revision_id = ?', args: [id] },
    { sql: 'DELETE FROM checklist_bp_respuesta WHERE revision_id = ?', args: [id] },
    { sql: 'DELETE FROM checklist_bp_revision WHERE id = ?', args: [id] },
  ]);
  return afectadas[2] > 0;
}

import { db, transaction } from '../../db/database.js';
import type { FotoEntrada, ItemChecklist, Respuesta, RespuestaItem, Revision, RevisionDatos } from './checklist-bp.types.js';

/** Requisitos vigentes de la plantilla, en orden */
export function obtenerPlantilla(): ItemChecklist[] {
  return db
    .prepare('SELECT id, seccion, seccion_orden, numero, requerimiento FROM checklist_bp_item WHERE activo = 1 ORDER BY seccion_orden, numero')
    .all()
    .map((r) => ({
      id: Number(r.id),
      seccion: String(r.seccion),
      seccionOrden: Number(r.seccion_orden),
      numero: Number(r.numero),
      requerimiento: String(r.requerimiento),
    }));
}

function respuestasDe(revisionIds: number[]): Map<number, RespuestaItem[]> {
  const mapa = new Map<number, RespuestaItem[]>(revisionIds.map((id) => [id, []]));
  if (!revisionIds.length) return mapa;
  const fotos = fotosDe(revisionIds);
  const filas = db
    .prepare(
      `SELECT revision_id, item_id, seccion, numero, requerimiento, respuesta, observacion
       FROM checklist_bp_respuesta WHERE revision_id IN (${revisionIds.map(() => '?').join(', ')})
       ORDER BY numero`,
    )
    .all(...revisionIds);
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

/** Ids de fotos agrupados por "revision-item" (sin el contenido, que se descarga aparte) */
function fotosDe(revisionIds: number[]): Map<string, number[]> {
  const mapa = new Map<string, number[]>();
  const filas = db
    .prepare(
      `SELECT id, revision_id, item_id FROM checklist_bp_foto
       WHERE revision_id IN (${revisionIds.map(() => '?').join(', ')}) ORDER BY id`,
    )
    .all(...revisionIds);
  for (const f of filas) {
    const clave = `${f.revision_id}-${f.item_id}`;
    mapa.set(clave, [...(mapa.get(clave) ?? []), Number(f.id)]);
  }
  return mapa;
}

/** Contenido de una foto para mostrarla */
export function obtenerFoto(id: number): { tipo: string; datos: Uint8Array } | null {
  const f = db.prepare('SELECT tipo, datos FROM checklist_bp_foto WHERE id = ?').get(id);
  return f ? { tipo: String(f.tipo), datos: f.datos as Uint8Array } : null;
}

/**
 * Sincroniza las fotos de la revisión: conserva las que siguen en la lista, borra las demás
 * e inserta las nuevas. Solo los requisitos marcados NO pueden tener fotos.
 */
function guardarFotos(revisionId: number, respuestas: RevisionDatos['respuestas']) {
  const conservar = new Set<number>();
  const nuevas: { itemId: number; foto: Exclude<FotoEntrada, { id: number }> }[] = [];
  for (const r of respuestas) {
    if (r.respuesta !== 'NO') continue;
    for (const foto of r.fotos) {
      if ('id' in foto) conservar.add(foto.id);
      else nuevas.push({ itemId: r.itemId, foto });
    }
  }

  const borrar = db.prepare('DELETE FROM checklist_bp_foto WHERE id = ?');
  for (const f of db.prepare('SELECT id FROM checklist_bp_foto WHERE revision_id = ?').all(revisionId)) {
    if (!conservar.has(Number(f.id))) borrar.run(f.id);
  }
  const insertar = db.prepare('INSERT INTO checklist_bp_foto (revision_id, item_id, tipo, datos) VALUES (?, ?, ?, ?)');
  for (const n of nuevas) insertar.run(revisionId, n.itemId, n.foto.tipo, n.foto.datos);
}

function aRevision(r: Record<string, unknown>, respuestas: RespuestaItem[]): Revision {
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
export function listarRevisiones(): Revision[] {
  const filas = db.prepare(`SELECT ${COLUMNAS} FROM checklist_bp_revision ORDER BY fecha DESC, id DESC`).all();
  const respuestas = respuestasDe(filas.map((f) => Number(f.id)));
  return filas.map((f) => aRevision(f, respuestas.get(Number(f.id)) ?? []));
}

export function obtenerRevision(id: number): Revision | null {
  const fila = db.prepare(`SELECT ${COLUMNAS} FROM checklist_bp_revision WHERE id = ?`).get(id);
  return fila ? aRevision(fila, respuestasDe([id]).get(id) ?? []) : null;
}

/** Guarda las respuestas copiando el texto vigente de cada requisito */
function guardarRespuestas(revisionId: number, respuestas: RevisionDatos['respuestas']) {
  db.prepare('DELETE FROM checklist_bp_respuesta WHERE revision_id = ?').run(revisionId);
  const insertar = db.prepare(
    `INSERT INTO checklist_bp_respuesta (revision_id, item_id, seccion, numero, requerimiento, respuesta, observacion)
     SELECT ?, id, seccion, numero, requerimiento, ?, ? FROM checklist_bp_item WHERE id = ?`,
  );
  for (const r of respuestas) insertar.run(revisionId, r.respuesta, r.observacion, r.itemId);
}

export function crearRevision(d: RevisionDatos): Revision {
  const id = transaction(() => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO checklist_bp_revision (fecha, sucursal, responsable, observaciones) VALUES (?, ?, ?, ?)')
      .run(d.fecha, d.sucursal, d.responsable, d.observaciones);
    guardarRespuestas(Number(lastInsertRowid), d.respuestas);
    guardarFotos(Number(lastInsertRowid), d.respuestas);
    return Number(lastInsertRowid);
  });
  return obtenerRevision(id)!;
}

export function actualizarRevision(id: number, d: RevisionDatos): Revision | null {
  const existe = transaction(() => {
    const { changes } = db
      .prepare(
        `UPDATE checklist_bp_revision SET fecha = ?, sucursal = ?, responsable = ?, observaciones = ?,
           actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?`,
      )
      .run(d.fecha, d.sucursal, d.responsable, d.observaciones, id);
    if (changes) {
      guardarRespuestas(id, d.respuestas);
      guardarFotos(id, d.respuestas);
    }
    return changes > 0;
  });
  return existe ? obtenerRevision(id) : null;
}

export function eliminarRevision(id: number): boolean {
  return db.prepare('DELETE FROM checklist_bp_revision WHERE id = ?').run(id).changes > 0;
}

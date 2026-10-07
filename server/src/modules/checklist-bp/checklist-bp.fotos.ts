// Fotos de evidencia del check list (tabla checklist_bp_foto). Reglas de formato: storage/evidencias.ts
import { db } from '../../db/database.js';
import type { FotoEntrada, RevisionDatos } from './checklist-bp.types.js';

/** Ids de fotos agrupados por "revision-item" (sin el contenido, que se descarga aparte) */
export function fotosDe(revisionIds: number[]): Map<string, number[]> {
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
export function guardarFotos(revisionId: number, respuestas: RevisionDatos['respuestas']) {
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

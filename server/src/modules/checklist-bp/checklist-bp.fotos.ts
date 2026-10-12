// Fotos de evidencia del check list (tabla checklist_bp_foto). Reglas de formato: storage/evidencias.ts
import type { InStatement } from '@libsql/client';
import { consultar, consultarUna } from '../../db/database.js';
import type { FotoEntrada, RevisionDatos } from './checklist-bp.types.js';

/** Ids de fotos agrupados por "revision-item" (sin el contenido, que se descarga aparte) */
export async function fotosDe(revisionIds: number[]): Promise<Map<string, number[]>> {
  const mapa = new Map<string, number[]>();
  const filas = await consultar(
    `SELECT id, revision_id, item_id FROM checklist_bp_foto
     WHERE revision_id IN (${revisionIds.map(() => '?').join(', ')}) ORDER BY id`,
    revisionIds,
  );
  for (const f of filas) {
    const clave = `${f.revision_id}-${f.item_id}`;
    mapa.set(clave, [...(mapa.get(clave) ?? []), Number(f.id)]);
  }
  return mapa;
}

/** Contenido de una foto para mostrarla */
export async function obtenerFoto(id: number): Promise<{ tipo: string; datos: Uint8Array } | null> {
  const f = await consultarUna('SELECT tipo, datos FROM checklist_bp_foto WHERE id = ?', [id]);
  return f ? { tipo: String(f.tipo), datos: new Uint8Array(f.datos as ArrayBuffer) } : null;
}

/**
 * Sentencias para sincronizar las fotos de la revisión: conserva las que siguen en la lista,
 * borra las demás e inserta las nuevas. Solo los requisitos marcados NO pueden tener fotos.
 */
export function sentenciasFotos(revisionId: number, respuestas: RevisionDatos['respuestas']): InStatement[] {
  const conservar: number[] = [];
  const sentencias: InStatement[] = [];
  const nuevas: InStatement[] = [];
  for (const r of respuestas) {
    if (r.respuesta !== 'NO') continue;
    for (const foto of r.fotos as FotoEntrada[]) {
      if ('id' in foto) conservar.push(foto.id);
      else
        nuevas.push({
          sql: 'INSERT INTO checklist_bp_foto (revision_id, item_id, tipo, datos) VALUES (?, ?, ?, ?)',
          args: [revisionId, r.itemId, foto.tipo, foto.datos],
        });
    }
  }
  sentencias.push(
    conservar.length
      ? {
          sql: `DELETE FROM checklist_bp_foto WHERE revision_id = ? AND id NOT IN (${conservar.map(() => '?').join(', ')})`,
          args: [revisionId, ...conservar],
        }
      : { sql: 'DELETE FROM checklist_bp_foto WHERE revision_id = ?', args: [revisionId] },
  );
  return [...sentencias, ...nuevas];
}

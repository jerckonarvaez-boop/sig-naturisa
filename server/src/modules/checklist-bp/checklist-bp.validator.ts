import { leerImagenDataUrl } from '../../storage/evidencias.js';
import { esFecha, esUnoDe, texto, type Validado } from '../../utils/validacion.js';
import { MAX_FOTOS_POR_ITEM, RESPUESTAS, type FotoEntrada, type Respuesta, type RevisionDatos } from './checklist-bp.types.js';

export function validarRevision(body: Record<string, unknown> | undefined): Validado<RevisionDatos> {
  if (!body) return { error: 'Faltan los datos de la revisión.' };
  const fecha = body.fecha;
  if (!esFecha(fecha)) return { error: 'La fecha no es válida.' };
  const sucursal = texto(body.sucursal, 120);
  if (!sucursal) return { error: 'La sucursal es obligatoria.' };
  if (!Array.isArray(body.respuestas)) return { error: 'Faltan las respuestas.' };

  const respuestas: RevisionDatos['respuestas'] = [];
  for (const r of body.respuestas as Record<string, unknown>[]) {
    if (!Number.isInteger(r?.itemId)) return { error: 'Hay una respuesta sin requisito.' };
    if (r.respuesta != null && !esUnoDe(RESPUESTAS, r.respuesta)) {
      return { error: `Respuesta no válida en el requisito ${r.itemId}.` };
    }
    const fotos = validarFotos(r.fotos);
    if ('error' in fotos) return { error: `${fotos.error} (requisito ${r.itemId}).` };
    respuestas.push({
      itemId: r.itemId as number,
      respuesta: (r.respuesta as Respuesta | null) ?? null,
      observacion: texto(r.observacion, 1000),
      fotos: fotos.datos,
    });
  }

  return {
    datos: {
      fecha,
      sucursal,
      responsable: texto(body.responsable, 120),
      observaciones: texto(body.observaciones, 4000),
      respuestas,
    },
  };
}

/** Cada foto es { id } (ya guardada) o { datos: "data:image/jpeg;base64,..." } (nueva) */
function validarFotos(valor: unknown): Validado<FotoEntrada[]> {
  if (valor == null) return { datos: [] };
  if (!Array.isArray(valor)) return { error: 'Las fotos no son válidas' };
  if (valor.length > MAX_FOTOS_POR_ITEM) return { error: `Máximo ${MAX_FOTOS_POR_ITEM} fotos por requisito` };

  const fotos: FotoEntrada[] = [];
  for (const f of valor as Record<string, unknown>[]) {
    if (Number.isInteger(f?.id)) {
      fotos.push({ id: f.id as number });
      continue;
    }
    const imagen = leerImagenDataUrl(f?.datos);
    if ('error' in imagen) return imagen;
    fotos.push(imagen);
  }
  return { datos: fotos };
}

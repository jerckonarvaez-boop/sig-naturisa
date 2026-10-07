/**
 * Archivos de evidencia (fotos). Reglas comunes para cualquier módulo que reciba imágenes:
 * formatos admitidos, tamaño máximo y lectura del formato "data URL" que envía el navegador.
 * Hoy el contenido se guarda en la base de datos (tabla de cada módulo); si en el futuro se
 * mueve a disco o a la nube, este es el punto a cambiar.
 */

export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_BYTES_IMAGEN = 3 * 1024 * 1024;

export interface Imagen {
  tipo: string;
  datos: Buffer;
}

/** Lee "data:image/jpeg;base64,..." y comprueba formato y tamaño */
export function leerImagenDataUrl(valor: unknown): Imagen | { error: string } {
  const partes = typeof valor === 'string' ? /^data:([\w/+.-]+);base64,(.+)$/.exec(valor) : null;
  if (!partes || !(TIPOS_IMAGEN as readonly string[]).includes(partes[1])) return { error: 'Formato de foto no admitido' };
  const datos = Buffer.from(partes[2], 'base64');
  if (datos.length > MAX_BYTES_IMAGEN) return { error: 'Una foto supera los 3 MB' };
  return { tipo: partes[1], datos };
}

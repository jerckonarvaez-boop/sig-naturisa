// Cifrado de datos que se guardan en el repositorio (AES-256-GCM, comprimidos con gzip).
// Sin la clave, el archivo no se puede leer ni modificar sin que se detecte.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';

const ALGORITMO = 'aes-256-gcm';

/** Clave nueva de 32 bytes, en texto (base64url) para guardarla como variable de entorno */
export const nuevaClave = () => randomBytes(32).toString('base64url');

function leerClave(clave: string): Buffer {
  const bytes = Buffer.from(clave.trim(), 'base64url');
  if (bytes.length !== 32) throw new Error('La clave debe tener 32 bytes (base64url).');
  return bytes;
}

/** Devuelve iv (12) + etiqueta (16) + datos cifrados */
export function cifrar(texto: string, clave: string): Buffer {
  const iv = randomBytes(12);
  const cifrador = createCipheriv(ALGORITMO, leerClave(clave), iv);
  const datos = Buffer.concat([cifrador.update(gzipSync(texto)), cifrador.final()]);
  return Buffer.concat([iv, cifrador.getAuthTag(), datos]);
}

export function descifrar(contenido: Buffer, clave: string): string {
  const descifrador = createDecipheriv(ALGORITMO, leerClave(clave), contenido.subarray(0, 12));
  descifrador.setAuthTag(contenido.subarray(12, 28));
  return gunzipSync(Buffer.concat([descifrador.update(contenido.subarray(28)), descifrador.final()])).toString('utf8');
}

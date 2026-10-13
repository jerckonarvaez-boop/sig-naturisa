/**
 * Borrador de correo para Outlook: un archivo .eml con "X-Unsent: 1". Al abrirlo, Outlook (escritorio)
 * lo muestra como un correo nuevo, con destinatarios, asunto, mensaje y adjuntos, listo para revisar y enviar.
 */

export interface Adjunto {
  nombre: string;
  tipo: string;
  datos: ArrayBuffer;
}

export interface BorradorCorreo {
  para: string;
  cc?: string;
  asunto: string;
  /** Texto plano; los saltos de línea se respetan */
  mensaje: string;
  adjuntos: Adjunto[];
}

const base64 = (bytes: Uint8Array) => {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
};
const base64Texto = (texto: string) => base64(new TextEncoder().encode(texto));
/** Líneas de 76 caracteres, como exige el formato MIME */
const enLineas = (b64: string) => b64.replace(/.{1,76}/g, '$&\r\n');
/** Encabezado con tildes: =?UTF-8?B?...?= */
const encabezado = (texto: string) => `=?UTF-8?B?${base64Texto(texto)}?=`;
const escaparHtml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function crearEml({ para, cc, asunto, mensaje, adjuntos }: BorradorCorreo): Blob {
  const limite = `----=_SIG_${Date.now().toString(36)}`;
  const html = `<html><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt">${escaparHtml(mensaje).replace(/\r?\n/g, '<br>')}</body></html>`;
  const partes = [
    'X-Unsent: 1',
    `To: ${para}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: ${encabezado(asunto)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${limite}"`,
    '',
    `--${limite}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    '',
    enLineas(base64Texto(html)),
    ...adjuntos.flatMap((a) => [
      `--${limite}`,
      `Content-Type: ${a.tipo}; name="${encabezado(a.nombre)}"`,
      `Content-Disposition: attachment; filename="${encabezado(a.nombre)}"`,
      'Content-Transfer-Encoding: base64',
      '',
      enLineas(base64(new Uint8Array(a.datos))),
    ]),
    `--${limite}--`,
    '',
  ];
  return new Blob([partes.join('\r\n')], { type: 'message/rfc822' });
}

/** Descarga un archivo generado en el navegador */
export function descargar(contenido: Blob, nombre: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(contenido);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

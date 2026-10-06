/**
 * Reduce una foto en el navegador antes de enviarla: lado mayor de `maxLado` px, JPEG.
 * Una foto de celular (3–8 MB) queda en ~150–300 KB. Devuelve un data URL.
 */
export async function reducirImagen(archivo: File, maxLado = 1600, calidad = 0.75): Promise<string> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {
      throw new Error(`No se pudo leer la imagen "${archivo.name}".`);
    });
    const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', calidad);
  } finally {
    URL.revokeObjectURL(url);
  }
}

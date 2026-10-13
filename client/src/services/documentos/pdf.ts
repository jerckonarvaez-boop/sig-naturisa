// Convierte un elemento de la página (ej. un informe con su diseño oficial) en un PDF A4.
// Las librerías se cargan solo al usarlo, para no hacer más pesada la carga inicial de la app.

export type Orientacion = 'vertical' | 'horizontal';

/**
 * Captura el elemento tal como se ve y lo coloca en páginas A4 (si es más alto que una página,
 * se reparte en varias). Devuelve el contenido del PDF.
 */
export async function elementoAPdf(elemento: HTMLElement, orientacion: Orientacion = 'vertical'): Promise<ArrayBuffer> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  const lienzo = await toCanvas(elemento, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });

  const pdf = new jsPDF({ orientation: orientacion === 'horizontal' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const anchoPagina = pdf.internal.pageSize.getWidth();
  const altoPagina = pdf.internal.pageSize.getHeight();
  // Alto (en píxeles del lienzo) que cabe en una página manteniendo la proporción
  const altoPorPagina = Math.floor((lienzo.width * altoPagina) / anchoPagina);

  for (let y = 0, pagina = 0; y < lienzo.height; y += altoPorPagina, pagina++) {
    const trozo = document.createElement('canvas');
    trozo.width = lienzo.width;
    trozo.height = Math.min(altoPorPagina, lienzo.height - y);
    trozo.getContext('2d')!.drawImage(lienzo, 0, y, lienzo.width, trozo.height, 0, 0, lienzo.width, trozo.height);
    if (pagina > 0) pdf.addPage();
    pdf.addImage(trozo.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, anchoPagina, (trozo.height * anchoPagina) / lienzo.width);
  }
  return pdf.output('arraybuffer');
}

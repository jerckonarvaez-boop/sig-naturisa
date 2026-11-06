// PDF en el navegador con pdf.js (se carga solo cuando se necesita): leer su texto o dibujar sus páginas.
import type { PDFDocumentLoadingTask } from 'pdfjs-dist';

/** Abre el PDF; quien lo abre lo cierra con destroy() */
export async function abrirPdf(datos: ArrayBuffer): Promise<PDFDocumentLoadingTask> {
  const [pdfjs, { default: worker }] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  return pdfjs.getDocument({ data: new Uint8Array(datos) });
}

/** Todo el texto del PDF, página por página */
export async function textoDePdf(archivo: Blob): Promise<string> {
  const carga = await abrirPdf(await archivo.arrayBuffer());
  try {
    const pdf = await carga.promise;
    const paginas: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const contenido = await (await pdf.getPage(i)).getTextContent();
      paginas.push(contenido.items.map((it) => ('str' in it ? it.str : '')).join(' '));
    }
    return paginas.join('\n');
  } finally {
    void carga.destroy();
  }
}

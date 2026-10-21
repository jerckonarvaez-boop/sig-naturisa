// Texto de un PDF, leído en el navegador con pdf.js (se carga solo cuando se elige un PDF).

/** Todo el texto del PDF, página por página */
export async function textoDePdf(archivo: File): Promise<string> {
  const [pdfjs, { default: worker }] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const carga = pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) });
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

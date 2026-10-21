import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { abrirPdf } from '../services/pdfjs';

interface VistaPdfProps {
  /** El PDF elegido (aún sin guardar) o la dirección del PDF guardado */
  origen: File | string;
  className?: string;
}

/**
 * Vista previa del PDF del laboratorio: dibuja las páginas con pdf.js, así se ve igual en la computadora y en el
 * celular (donde el visor del navegador no muestra PDF dentro de la página).
 */
export function VistaPdf({ origen, className = '' }: VistaPdfProps) {
  const paginas = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<{ cargando: boolean; total?: number; error?: string }>({ cargando: true });
  // Para abrirlo en otra pestaña (un PDF sin guardar se abre desde la memoria del navegador)
  const enlace = useMemo(() => (typeof origen === 'string' ? origen : URL.createObjectURL(origen)), [origen]);
  useEffect(() => () => (typeof origen === 'string' ? undefined : URL.revokeObjectURL(enlace)), [origen, enlace]);

  useEffect(() => {
    let vigente = true;
    let cerrar: (() => void) | undefined;
    setEstado({ cargando: true });
    (async () => {
      let datos: ArrayBuffer;
      if (typeof origen === 'string') {
        const r = await fetch(origen, { credentials: 'same-origin' });
        if (!r.ok) throw new Error(`no se pudo descargar (${r.status})`);
        datos = await r.arrayBuffer();
      } else datos = await origen.arrayBuffer();
      const carga = await abrirPdf(datos);
      cerrar = () => void carga.destroy();
      if (!vigente) return cerrar();
      const pdf = await carga.promise;
      const div = paginas.current;
      if (!div || !vigente) return;
      div.replaceChildren();
      // Nitidez: se dibuja al ancho del recuadro por la densidad de la pantalla (y se escala con CSS si cambia)
      const ancho = Math.max(div.clientWidth, 320) * Math.min(window.devicePixelRatio || 1, 2);
      for (let i = 1; i <= pdf.numPages && vigente; i++) {
        const pagina = await pdf.getPage(i);
        const vista = pagina.getViewport({ scale: ancho / pagina.getViewport({ scale: 1 }).width });
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.floor(vista.width);
        lienzo.height = Math.floor(vista.height);
        lienzo.className = 'h-auto w-full rounded bg-white shadow-sm';
        lienzo.setAttribute('aria-label', `Página ${i} de ${pdf.numPages}`);
        div.append(lienzo);
        await pagina.render({ canvas: lienzo, canvasContext: lienzo.getContext('2d')!, viewport: vista }).promise;
      }
      if (vigente) setEstado({ cargando: false, total: pdf.numPages });
    })().catch((e: Error) => vigente && setEstado({ cargando: false, error: e.message }));
    return () => {
      vigente = false;
      cerrar?.();
    };
  }, [origen]);

  return (
    <Card
      compact
      title="Vista previa del PDF"
      subtitle={estado.error ? undefined : estado.cargando ? 'Cargando…' : `${estado.total} ${estado.total === 1 ? 'página' : 'páginas'}`}
      actions={
        <a href={enlace} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline">
          <ExternalLink size={14} /> Abrir en otra pestaña
        </a>
      }
      className={className}
    >
      {estado.error && <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">No se pudo mostrar el PDF: {estado.error}</p>}
      <div ref={paginas} className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto rounded-lg bg-slate-100 p-2 dark:bg-slate-800" />
    </Card>
  );
}

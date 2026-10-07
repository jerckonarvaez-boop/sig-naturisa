import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { Camera, ImagePlus, LoaderCircle, X } from 'lucide-react';
import { reducirImagen } from '@/services/storage/imagenes';
import { urlFoto } from '../services/checklist.api';
import { MAX_FOTOS_POR_ITEM, type Foto } from '../types';

interface FotosItemProps {
  fotos: Foto[];
  onCambiar: (fotos: Foto[]) => void;
  numero: number;
}

/**
 * Fotos de evidencia de un requisito marcado NO: miniaturas, agregar y quitar.
 * En celulares/tablets (pantalla táctil) ofrece "Tomar foto" (abre la cámara) y "Galería";
 * en el PC, solo "Agregar foto" (elegir archivos).
 */
export function FotosItem({ fotos, onCambiar, numero }: FotosItemProps) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const disponibles = MAX_FOTOS_POR_ITEM - fotos.length;

  async function agregar(e: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(e.target.files ?? [])];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivos.length) return;
    setError(archivos.length > disponibles ? `Máximo ${MAX_FOTOS_POR_ITEM} fotos por requisito.` : null);
    setProcesando(true);
    try {
      const nuevas = await Promise.all(archivos.slice(0, disponibles).map((a) => reducirImagen(a)));
      onCambiar([...fotos, ...nuevas.map((datos) => ({ datos }))]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="mt-1.5 ml-9">
      <div className="flex flex-wrap items-center gap-2">
        {fotos.map((foto, i) => (
          <div key={'id' in foto ? foto.id : `nueva-${i}`} className="relative">
            <button
              type="button"
              onClick={() => setAmpliada(urlFoto(foto))}
              aria-label={`Ver foto ${i + 1} del requisito ${numero}`}
              className="block overflow-hidden rounded-md border border-slate-300 dark:border-slate-700"
            >
              <img src={urlFoto(foto)} alt="" className="h-16 w-16 object-cover print:h-32 print:w-32" />
            </button>
            <button
              type="button"
              onClick={() => onCambiar(fotos.filter((_, j) => j !== i))}
              aria-label={`Quitar foto ${i + 1} del requisito ${numero}`}
              className="absolute -top-2 -right-2 rounded-full bg-slate-800 p-1 text-white shadow hover:bg-red-600 print:hidden"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {disponibles > 0 &&
          (procesando ? (
            <span className={`${BOTON} inline-flex opacity-60`}>
              <LoaderCircle size={18} className="animate-spin" /> Procesando…
            </span>
          ) : (
            <>
              <BotonArchivo camara onChange={agregar} className="hidden pointer-coarse:inline-flex">
                <Camera size={18} /> Tomar foto
              </BotonArchivo>
              <BotonArchivo onChange={agregar}>
                <ImagePlus size={18} />
                <span className="pointer-coarse:hidden">Agregar foto</span>
                <span className="hidden pointer-coarse:inline">Galería</span>
              </BotonArchivo>
            </>
          ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {ampliada && <VisorFoto src={ampliada} onCerrar={() => setAmpliada(null)} />}
    </div>
  );
}

const BOTON =
  // Sin "display": cada botón decide si se muestra (inline-flex) u oculta (hidden)
  'h-16 min-w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-400 px-3 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300 print:hidden';

/** Botón que abre la cámara (camara) o el selector de imágenes (varias a la vez). */
function BotonArchivo({
  camara,
  onChange,
  className = 'inline-flex',
  children,
}: {
  camara?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`${BOTON} ${className} cursor-pointer hover:border-brand-500 hover:text-brand-500`}>
      {children}
      <input type="file" accept="image/*" capture={camara ? 'environment' : undefined} multiple={!camara} onChange={onChange} className="sr-only" />
    </label>
  );
}

/** Foto a pantalla completa; se cierra con clic o Escape. */
function VisorFoto({ src, onCerrar }: { src: string; onCerrar: () => void }) {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  return (
    <div role="dialog" aria-label="Foto ampliada" onClick={onCerrar} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 print:hidden">
      <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
      <button type="button" aria-label="Cerrar" className="absolute top-4 right-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/30">
        <X size={20} />
      </button>
    </div>
  );
}

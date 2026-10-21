import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  /** Botones al pie (Guardar, Cancelar...) */
  pie?: ReactNode;
  ancho?: 'md' | 'lg';
  /** false en formularios largos: un clic fuera no cierra la ventana (y no se pierde lo escrito) */
  cerrarAlPulsarFuera?: boolean;
}

/**
 * Ventana emergente centrada. Se cierra con Escape, con la ✕ o haciendo clic fuera (si se permite).
 * El contenido se desplaza dentro de la ventana: el título y los botones del pie quedan siempre a la vista.
 */
export function Modal({ titulo, onCerrar, children, pie, ancho = 'md', cerrarAlPulsarFuera = true }: ModalProps) {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => cerrarAlPulsarFuera && e.target === e.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`flex max-h-full w-full flex-col rounded-xl bg-white shadow-xl dark:bg-slate-900 ${ancho === 'lg' ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {pie && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800">
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}

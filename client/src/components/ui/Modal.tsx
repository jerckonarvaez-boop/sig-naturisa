import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  /** Botones al pie (Guardar, Cancelar...) */
  pie?: ReactNode;
  ancho?: 'md' | 'lg';
}

/** Ventana emergente centrada. Se cierra con Escape o haciendo clic fuera. */
export function Modal({ titulo, onCerrar, children, pie, ancho = 'md' }: ModalProps) {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`w-full rounded-xl bg-white shadow-xl dark:bg-slate-900 ${ancho === 'lg' ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
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
        <div className="px-5 py-4">{children}</div>
        {pie && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800">
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}

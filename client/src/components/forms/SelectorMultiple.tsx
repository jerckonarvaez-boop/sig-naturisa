import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

interface SelectorMultipleProps {
  /** Valores que se pueden elegir (en este orden) */
  opciones: string[];
  /** Elegidos, separados por espacio (ej. "Nitzschia Skeletonema") */
  valor: string;
  onCambiar: (valor: string) => void;
  /** Para lectores de pantalla, ej. "Géneros de diatomeas de PS-79" */
  etiqueta: string;
  className?: string;
}

const partes = (v: string) => v.split(/\s+/).filter(Boolean);
const igual = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Elegir uno o varios valores de una lista fija. La lista se abre flotando sobre la página (portal), así no la
 * recorta una tabla con desplazamiento. Un valor guardado que ya no está en la lista se muestra para poder quitarlo.
 */
export function SelectorMultiple({ opciones, valor, onCambiar, etiqueta, className = '' }: SelectorMultipleProps) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const elegidos = partes(valor);
  const marcado = (o: string) => elegidos.some((e) => igual(e, o));
  const fuera = elegidos.filter((e) => !opciones.some((o) => igual(o, e)));

  /** Marca o desmarca uno; los de la lista quedan en su orden y los que no están en la lista, al final */
  const alternar = (o: string) => {
    const enLista = opciones.filter((x) => (igual(x, o) ? !marcado(x) : marcado(x)));
    const extra = fuera.filter((x) => !igual(x, o));
    onCambiar([...enLista, ...extra].join(' '));
  };

  // Ubica la lista bajo el botón (o encima si no cabe)
  useLayoutEffect(() => {
    if (!abierto || !boton.current) return;
    const r = boton.current.getBoundingClientRect();
    const alto = panel.current?.offsetHeight ?? 200;
    const arriba = r.bottom + alto + 8 > window.innerHeight && r.top > alto + 8;
    setPosicion({ top: arriba ? r.top - alto - 4 : r.bottom + 4, left: Math.min(r.left, window.innerWidth - 220), minWidth: Math.max(r.width, 200) });
  }, [abierto, valor]);

  // Se cierra al pulsar fuera, con Escape o al desplazar la página
  useEffect(() => {
    if (!abierto) return;
    const cerrar = () => setAbierto(false);
    const fueraDe = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !boton.current?.contains(t)) cerrar();
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrar();
        boton.current?.focus();
      }
    };
    const desplazar = (e: Event) => {
      if (!panel.current?.contains(e.target as Node)) cerrar();
    };
    document.addEventListener('mousedown', fueraDe);
    document.addEventListener('keydown', tecla);
    window.addEventListener('scroll', desplazar, true);
    window.addEventListener('resize', cerrar);
    return () => {
      document.removeEventListener('mousedown', fueraDe);
      document.removeEventListener('keydown', tecla);
      window.removeEventListener('scroll', desplazar, true);
      window.removeEventListener('resize', cerrar);
    };
  }, [abierto]);

  const fila = (o: string, nota?: string) => {
    const activo = nota ? true : marcado(o);
    return (
      <button
        key={o}
        type="button"
        role="menuitemcheckbox"
        aria-checked={activo}
        onClick={() => alternar(o)}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <span
          className={`flex size-4 shrink-0 items-center justify-center rounded border ${
            activo ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-400 dark:border-slate-500'
          }`}
        >
          {activo && <Check size={12} strokeWidth={3} />}
        </span>
        <span className="italic">{o}</span>
        {nota && <span className="text-[11px] text-amber-700 dark:text-amber-300">{nota}</span>}
      </button>
    );
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={etiqueta}
        title={elegidos.join(', ') || etiqueta}
        onClick={() => setAbierto((a) => !a)}
        className={`flex min-h-[30px] w-full items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-left text-[12px] focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 ${className}`}
      >
        <span className={`flex-1 truncate ${elegidos.length ? 'italic' : 'text-slate-400 dark:text-slate-500'}`}>
          {elegidos.length ? elegidos.join(', ') : 'Géneros…'}
        </span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>
      {abierto &&
        createPortal(
          <div
            ref={panel}
            role="menu"
            aria-label={etiqueta}
            style={{ position: 'fixed', top: posicion?.top ?? -9999, left: posicion?.left ?? -9999, minWidth: posicion?.minWidth }}
            className="z-50 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            {opciones.map((o) => fila(o))}
            {fuera.map((o) => fila(o, '(no está en la lista)'))}
            {elegidos.length > 0 && (
              <button
                type="button"
                onClick={() => onCambiar('')}
                className="mt-1 w-full rounded px-2 py-1 text-left text-[12px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Quitar todos
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

import { createContext, useContext, useState, type FocusEvent, type PointerEvent, type ReactNode } from 'react';

export interface TipContent {
  /** Valor principal (se muestra destacado) */
  valor: string;
  /** Qué representa el valor (categoría, mes...) */
  etiqueta: string;
  /** Texto adicional opcional */
  detalle?: string;
}

interface TipState extends TipContent {
  x: number;
  y: number;
}

const TipContext = createContext<(tip: TipState | null) => void>(() => {});

/** Envuelve una página o sección para que sus gráficos puedan mostrar tooltips. */
export function TooltipLayer({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<TipState | null>(null);
  return (
    <TipContext.Provider value={setTip}>
      {children}
      {tip && <Tooltip {...tip} />}
    </TipContext.Provider>
  );
}

const ANCHO = 260;
const ALTO = 90;

function Tooltip({ x, y, valor, etiqueta, detalle }: TipState) {
  const left = x + 14 + ANCHO > window.innerWidth ? x - 14 - ANCHO : x + 14;
  const top = y + 14 + ALTO > window.innerHeight ? y - 14 - ALTO : y + 14;
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white shadow-lg"
      style={{ left: Math.max(8, left), top: Math.max(8, top), maxWidth: ANCHO }}
    >
      <p className="text-base font-semibold tabular-nums">{valor}</p>
      <p className="text-xs text-slate-300">{etiqueta}</p>
      {detalle && <p className="mt-0.5 text-xs text-slate-400">{detalle}</p>}
    </div>
  );
}

/**
 * Devuelve una función que genera los eventos para mostrar un tooltip
 * al pasar el ratón o al enfocar con teclado: <rect {...tip({ valor, etiqueta })} />
 */
export function useTip() {
  const setTip = useContext(TipContext);
  return (content: TipContent) => ({
    onPointerMove: (e: PointerEvent) => setTip({ ...content, x: e.clientX, y: e.clientY }),
    onPointerLeave: () => setTip(null),
    onFocus: (e: FocusEvent<Element>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ ...content, x: r.left + r.width / 2, y: r.top + r.height / 2 });
    },
    onBlur: () => setTip(null),
  });
}

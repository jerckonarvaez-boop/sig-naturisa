import type { Respuesta } from '../types';

const OPCIONES: { valor: Respuesta; activo: string }[] = [
  { valor: 'SI', activo: 'bg-emerald-600 text-white border-emerald-600' },
  { valor: 'NO', activo: 'bg-red-600 text-white border-red-600' },
  { valor: 'N/A', activo: 'bg-slate-500 text-white border-slate-500' },
];

interface BotonesRespuestaProps {
  valor: Respuesta | null;
  onCambiar: (valor: Respuesta | null) => void;
  etiqueta: string;
}

/** Selector SI / NO / N/A. Pulsar la opción ya marcada la desmarca. */
export function BotonesRespuesta({ valor, onCambiar, etiqueta }: BotonesRespuestaProps) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex shrink-0 overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
      {OPCIONES.map((o, i) => {
        const marcado = valor === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => onCambiar(marcado ? null : o.valor)}
            className={`w-14 py-2 text-xs font-bold transition-colors sm:w-11 sm:py-1 ${i > 0 ? 'border-l border-slate-300 dark:border-slate-600' : ''} ${
              marcado ? o.activo : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {o.valor}
          </button>
        );
      })}
    </div>
  );
}

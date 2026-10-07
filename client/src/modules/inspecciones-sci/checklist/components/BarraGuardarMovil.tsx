import { Save } from 'lucide-react';
import type { Mensaje } from '../hooks/useRevisionForm';
import type { Conteo } from '../logic/calculo';
import { BarraCumplimiento } from './Cumplimiento';

interface BarraGuardarMovilProps {
  conteo: Conteo;
  mensaje: Mensaje;
  guardando: boolean;
  onGuardar: () => void;
}

/** Barra fija en móvil/tablet: cumplimiento y botón Guardar siempre a mano. */
export function BarraGuardarMovil({ conteo, mensaje, guardando, onGuardar }: BarraGuardarMovilProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] xl:hidden dark:border-slate-800 dark:bg-slate-900 print:hidden">
      <div className="min-w-0 flex-1">
        {mensaje ? (
          <p className={`truncate text-xs font-semibold ${mensaje.error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {mensaje.texto}
          </p>
        ) : (
          <>
            <BarraCumplimiento conteo={conteo} />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {conteo.total - conteo.sinResponder}/{conteo.total} respondidos
            </p>
          </>
        )}
      </div>
      {/* Sin estilo hover: en pantallas táctiles quedaría "pegado" tras pulsar */}
      <button
        type="button"
        onClick={onGuardar}
        disabled={guardando}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-sky-600"
      >
        <Save size={15} /> {guardando ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  );
}

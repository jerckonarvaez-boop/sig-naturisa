import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { contar } from '../calculo';
import type { ItemChecklist, Respuesta } from '../types';
import { BotonesRespuesta } from './BotonesRespuesta';
import { BarraCumplimiento } from './Cumplimiento';

export interface RespuestaEditable {
  respuesta: Respuesta | null;
  observacion: string;
}

interface SeccionChecklistProps {
  seccion: string;
  items: ItemChecklist[];
  respuestas: Record<number, RespuestaEditable>;
  onCambiar: (itemId: number, cambio: Partial<RespuestaEditable>) => void;
}

/** Una área del check list con sus requisitos y su % de cumplimiento en vivo. */
export function SeccionChecklist({ seccion, items, respuestas, onCambiar }: SeccionChecklistProps) {
  const conteo = contar(items.map((i) => respuestas[i.id]?.respuesta ?? null));
  const pendientes = items.filter((i) => !respuestas[i.id]?.respuesta);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm break-inside-avoid dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <h2 className="min-w-0 flex-1 basis-full text-sm font-semibold sm:basis-0">{seccion}</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {conteo.total - conteo.sinResponder}/{conteo.total} respondidos
        </span>
        <span className="w-32">
          <BarraCumplimiento conteo={conteo} />
        </span>
        {pendientes.length > 0 && (
          <button
            type="button"
            onClick={() => pendientes.forEach((i) => onCambiar(i.id, { respuesta: 'SI' }))}
            className="text-xs font-semibold text-brand-500 hover:underline print:hidden"
          >
            Marcar pendientes como SI
          </button>
        )}
      </header>

      <ol>
        {items.map((item) => (
          <FilaItem
            key={item.id}
            item={item}
            valor={respuestas[item.id] ?? { respuesta: null, observacion: '' }}
            onCambiar={(cambio) => onCambiar(item.id, cambio)}
          />
        ))}
      </ol>
    </section>
  );
}

function FilaItem({
  item,
  valor,
  onCambiar,
}: {
  item: ItemChecklist;
  valor: RespuestaEditable;
  onCambiar: (cambio: Partial<RespuestaEditable>) => void;
}) {
  const [verNota, setVerNota] = useState(Boolean(valor.observacion));
  const mostrarNota = verNota || Boolean(valor.observacion);

  return (
    <li
      className={`border-b border-slate-100 px-4 py-2 last:border-b-0 dark:border-slate-800 ${
        valor.respuesta === 'NO' ? 'bg-red-50/70 dark:bg-red-500/5' : ''
      }`}
    >
      {/* En móvil los botones pasan debajo del texto; en pantallas anchas van a la derecha */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 sm:flex-nowrap">
        <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-semibold text-slate-400 tabular-nums">{item.numero}</span>
        <p className="min-w-0 flex-1 basis-[calc(100%-2.25rem)] text-[13px] leading-snug sm:basis-auto">{item.requerimiento}</p>
        <div className="ml-9 flex items-center gap-2 sm:ml-0">
          <BotonesRespuesta
            valor={valor.respuesta}
            onCambiar={(respuesta) => onCambiar({ respuesta })}
            etiqueta={`Cumplimiento del requisito ${item.numero}`}
          />
          <button
            type="button"
            onClick={() => setVerNota((v) => !v)}
            title="Agregar observación"
            aria-label={`Agregar observación al requisito ${item.numero}`}
            className={`shrink-0 rounded p-1.5 hover:bg-slate-100 sm:order-first sm:p-1 dark:hover:bg-slate-800 print:hidden ${
              valor.observacion ? 'text-brand-500' : 'text-slate-400'
            }`}
          >
            <MessageSquarePlus size={16} />
          </button>
        </div>
      </div>
      {mostrarNota && (
        <input
          value={valor.observacion}
          onChange={(e) => onCambiar({ observacion: e.target.value })}
          maxLength={1000}
          placeholder="Observación (qué falta, acción a tomar…)"
          className="mt-1.5 ml-9 w-[calc(100%-2.25rem)] rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
        />
      )}
    </li>
  );
}

import { CheckCircle2, Printer, Save, Trash2 } from 'lucide-react';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import type { Mensaje } from '../hooks/useRevisionForm';
import type { Conteo } from '../logic/calculo';
import { BarraCumplimiento, PorcentajeGrande } from './Cumplimiento';

interface ResumenCumplimientoProps {
  conteo: Conteo;
  areas: { seccion: string; conteo: Conteo }[];
  mensaje: Mensaje;
  guardando: boolean;
  /** Solo las revisiones ya guardadas se pueden eliminar */
  puedeEliminar: boolean;
  onGuardar: () => void;
  onEliminar: () => void;
}

/** Panel lateral del formulario: cumplimiento general y por área, mensajes y acciones. */
export function ResumenCumplimiento({ conteo, areas, mensaje, guardando, puedeEliminar, onGuardar, onEliminar }: ResumenCumplimientoProps) {
  return (
    <Card compact title="Cumplimiento general">
      <PorcentajeGrande conteo={conteo} />
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        {conteo.total - conteo.sinResponder} de {conteo.total} respondidos · {conteo.si} SI · {conteo.no} NO · {conteo.na} N/A
      </p>

      <h3 className="mb-1 text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">Por área</h3>
      <dl className="mb-4 space-y-2">
        {areas.map((a) => (
          <div key={a.seccion}>
            <dt className="truncate text-xs" title={a.seccion}>
              {a.seccion}
            </dt>
            <dd>
              <BarraCumplimiento conteo={a.conteo} />
            </dd>
          </div>
        ))}
      </dl>

      {mensaje && (
        <p
          role="status"
          className={`mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
            mensaje.error
              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
          }`}
        >
          {!mensaje.error && <CheckCircle2 size={14} />}
          {mensaje.texto}
        </p>
      )}

      <div className="flex flex-col gap-2 print:hidden">
        <button
          type="button"
          onClick={onGuardar}
          disabled={guardando}
          className={`${BOTON_PRIMARIO} inline-flex items-center justify-center gap-2 py-2`}
        >
          <Save size={15} /> {guardando ? 'Guardando…' : 'Guardar revisión'}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Printer size={14} /> Imprimir
          </button>
          {puedeEliminar && (
            <button
              type="button"
              onClick={onEliminar}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

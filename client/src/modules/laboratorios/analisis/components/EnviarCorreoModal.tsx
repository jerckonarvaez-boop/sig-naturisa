import { useState, type RefObject } from 'react';
import { CheckCircle2, Download, LoaderCircle, Mail, PencilLine } from 'lucide-react';
import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Modal } from '@/components/ui/Modal';
import type { Orientacion } from '@/services/documentos/pdf';
import { useEnvioCorreo } from '../hooks/useEnvioCorreo';
import { MARCADORES } from '../logic/correo';
import type { SeccionLab } from '../types';

interface EnviarCorreoModalProps {
  seccion: SeccionLab;
  codigo: string;
  sucursal: string;
  fechaEmision: string;
  reporte: RefObject<HTMLDivElement | null>;
  orientacion: Orientacion;
  onCerrar: () => void;
}

/** Enviar el informe por correo: crea un borrador de Outlook con el PDF adjunto. */
export function EnviarCorreoModal({ onCerrar, ...opciones }: EnviarCorreoModalProps) {
  const c = useEnvioCorreo(opciones);
  const [editandoPlantilla, setEditandoPlantilla] = useState(false);
  const [plantilla, setPlantilla] = useState(c.plantilla);

  const abrirEditor = () => {
    setPlantilla(c.plantilla);
    setEditandoPlantilla(true);
  };

  return (
    <Modal
      titulo={`Enviar por correo · ${opciones.codigo}`}
      onCerrar={onCerrar}
      ancho="lg"
      pie={
        <>
          <button
            type="button"
            onClick={c.descargarPdf}
            disabled={c.ocupado}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Download size={15} /> Descargar PDF
          </button>
          <button
            type="button"
            onClick={c.crearBorrador}
            disabled={c.ocupado || !c.cargado}
            className={`${BOTON_PRIMARIO} ml-auto inline-flex items-center gap-2 py-2`}
          >
            {c.ocupado ? <LoaderCircle size={15} className="animate-spin" /> : <Mail size={15} />}
            {c.ocupado ? 'Generando…' : 'Crear borrador en Outlook'}
          </button>
        </>
      }
    >
      {!c.cargado && !c.estado ? (
        <p className="py-6 text-center text-sm text-slate-500">Cargando…</p>
      ) : (
        <div className="grid gap-3">
          <Campo etiqueta="Para *">
            <input value={c.para} onChange={(e) => c.setPara(e.target.value)} placeholder="correo@naturisa.com.ec; otro@…" className={CLASE_CONTROL} />
          </Campo>
          <Campo etiqueta="CC">
            <input value={c.cc} onChange={(e) => c.setCc(e.target.value)} className={CLASE_CONTROL} />
          </Campo>
          <p className="-mt-1 text-xs text-slate-500 dark:text-slate-400">
            Separe varios correos con punto y coma. Se recuerdan para los próximos informes de <b>{opciones.sucursal}</b>.
          </p>
          <Campo etiqueta="Asunto">
            <input value={c.asunto} onChange={(e) => c.setAsunto(e.target.value)} className={CLASE_CONTROL} />
          </Campo>
          <Campo etiqueta="Mensaje">
            <textarea rows={6} value={c.mensaje} onChange={(e) => c.setMensaje(e.target.value)} className={CLASE_CONTROL} />
          </Campo>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Se adjunta el informe en PDF con el formato oficial. Los cambios de arriba solo aplican a este correo.
          </p>

          {/* Texto predeterminado */}
          {!editandoPlantilla ? (
            <button type="button" onClick={abrirEditor} className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-brand-500 hover:underline">
              <PencilLine size={14} /> Cambiar texto predeterminado
            </button>
          ) : (
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="mb-2 text-sm font-semibold">Texto predeterminado para todos los informes</p>
              <div className="grid gap-2">
                <Campo etiqueta="Asunto">
                  <input value={plantilla.asunto} onChange={(e) => setPlantilla({ ...plantilla, asunto: e.target.value })} className={CLASE_CONTROL} />
                </Campo>
                <Campo etiqueta="Mensaje">
                  <textarea rows={5} value={plantilla.mensaje} onChange={(e) => setPlantilla({ ...plantilla, mensaje: e.target.value })} className={CLASE_CONTROL} />
                </Campo>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Datos automáticos: {MARCADORES.map(([m, d]) => `${m} = ${d}`).join(' · ')}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={c.ocupado}
                    onClick={async () => {
                      if (await c.guardarPlantilla(plantilla)) setEditandoPlantilla(false);
                    }}
                    className={`${BOTON_PRIMARIO} py-1.5`}
                  >
                    Guardar texto predeterminado
                  </button>
                  <button type="button" onClick={() => setEditandoPlantilla(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {c.estado && (
            <p
              role="status"
              className={`flex items-start gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${
                c.estado.error
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
              }`}
            >
              {!c.estado.error && <CheckCircle2 size={15} className="mt-0.5 shrink-0" />}
              {c.estado.texto}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

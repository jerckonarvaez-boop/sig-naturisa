import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Modal } from '@/components/ui/Modal';
import { guardarAvisos, obtenerAvisos, probarAvisos, type AvisosCalendario } from '../services/eventos.api';

type Mensaje = { texto: string; error?: boolean } | null;

/** Avisos por correo del calendario: a quién se envían y con cuántos días de anticipación. */
export function AvisosModal({ onCerrar }: { onCerrar: () => void }) {
  const [estado, setEstado] = useState<AvisosCalendario | null>(null);
  const [para, setPara] = useState('');
  const [dias, setDias] = useState('7');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  useEffect(() => {
    obtenerAvisos()
      .then((a) => {
        setEstado(a);
        setPara(a.para);
        setDias(String(a.dias));
      })
      .catch((e) => setMensaje({ texto: (e as Error).message, error: true }));
  }, []);

  async function accion(fn: () => Promise<string>) {
    setOcupado(true);
    setMensaje(null);
    try {
      setMensaje({ texto: await fn() });
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    } finally {
      setOcupado(false);
    }
  }

  const guardar = (e?: FormEvent) => {
    e?.preventDefault();
    return accion(async () => {
      const nuevo = await guardarAvisos({ para, dias: Number(dias) });
      setEstado(nuevo);
      setPara(nuevo.para);
      return 'Guardado.';
    });
  };

  const probar = () =>
    accion(async () => {
      await guardarAvisos({ para, dias: Number(dias) });
      const { para: enviados } = await probarAvisos();
      return `Correo de prueba enviado a ${enviados.join(', ')}. Revise también la carpeta de correo no deseado.`;
    });

  return (
    <Modal
      titulo="Avisos por correo"
      onCerrar={onCerrar}
      pie={
        <>
          <button
            type="button"
            onClick={probar}
            disabled={ocupado || !estado?.correoConfigurado}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Send size={15} /> Enviar prueba
          </button>
          <button type="submit" form="form-avisos" disabled={ocupado || !estado} className={`${BOTON_PRIMARIO} ml-auto py-2`}>
            {ocupado ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="form-avisos" onSubmit={guardar} className="grid gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Antes de cada evento con <b>"Avisarme por correo"</b> activado, el sistema envía un recordatorio a estos correos (una sola
          vez por evento; si se reprograma la fecha, vuelve a avisar).
        </p>

        <Campo etiqueta="Enviar a (separe varios correos con ;)">
          <input
            value={para}
            onChange={(e) => setPara(e.target.value)}
            placeholder="nombre@naturisa.com; otro@naturisa.com"
            className={CLASE_CONTROL}
          />
        </Campo>
        <Campo etiqueta="Días de anticipación">
          <input type="number" min={1} max={60} required value={dias} onChange={(e) => setDias(e.target.value)} className={`${CLASE_CONTROL} max-w-28`} />
        </Campo>

        {estado && (
          <p
            role="status"
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
              estado.correoConfigurado
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'
            }`}
          >
            {estado.correoConfigurado ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertTriangle size={15} className="shrink-0" />}
            {estado.correoConfigurado
              ? `Los avisos se envían desde ${estado.remitente}.`
              : 'Aún no hay una cuenta de correo de envío configurada en el servidor: los destinatarios se guardan, pero los avisos empezarán a llegar cuando se configure.'}
          </p>
        )}

        {mensaje && (
          <p role="status" className={`text-sm ${mensaje.error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {mensaje.texto}
          </p>
        )}
      </form>
    </Modal>
  );
}

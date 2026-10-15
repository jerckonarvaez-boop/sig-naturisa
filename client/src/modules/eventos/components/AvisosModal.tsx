import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Copy, RefreshCw, Send } from 'lucide-react';
import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Modal } from '@/components/ui/Modal';
import {
  guardarAvisos,
  nuevaClaveAvisos,
  obtenerAvisos,
  probarAvisos,
  urlListaAvisos,
  type AvisosCalendario,
} from '../services/eventos.api';

type Mensaje = { texto: string; error?: boolean } | null;

const BOTON_SECUNDARIO =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800';

/**
 * Avisos por correo del calendario: días de anticipación y cómo se envían —
 * desde el propio Outlook con Power Automate (lista con clave secreta) o, si el servidor tiene
 * una cuenta SMTP, directamente a los correos indicados.
 */
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

  const enlace = estado ? urlListaAvisos(estado.claveFeed) : '';

  const copiar = () =>
    accion(async () => {
      await navigator.clipboard.writeText(enlace);
      return 'Dirección copiada.';
    });

  const cambiarClave = () => {
    if (!window.confirm('¿Generar una dirección nueva? La anterior dejará de funcionar y tendrá que actualizarla en Power Automate.')) return;
    accion(async () => {
      const { claveFeed } = await nuevaClaveAvisos();
      setEstado((e) => (e ? { ...e, claveFeed } : e));
      return 'Dirección nueva generada.';
    });
  };

  return (
    <Modal
      titulo="Avisos por correo"
      onCerrar={onCerrar}
      ancho="lg"
      pie={
        <>
          {estado?.correoConfigurado && (
            <button type="button" onClick={probar} disabled={ocupado} className={`${BOTON_SECUNDARIO} py-2`}>
              <Send size={15} /> Enviar prueba
            </button>
          )}
          <button type="submit" form="form-avisos" disabled={ocupado || !estado} className={`${BOTON_PRIMARIO} ml-auto py-2`}>
            {ocupado ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="form-avisos" onSubmit={guardar} className="grid gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Se avisa de cada evento con <b>"Avisarme por correo"</b> activado cuando falten estos días (una sola vez por evento; si se
          reprograma la fecha, vuelve a avisar).
        </p>
        <Campo etiqueta="Días de anticipación">
          <input type="number" min={1} max={60} required value={dias} onChange={(e) => setDias(e.target.value)} className={`${CLASE_CONTROL} max-w-28`} />
        </Campo>

        {/* Envío desde el propio correo de Naturisa con Power Automate */}
        <section className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <h3 className="text-sm font-semibold">Desde su correo de Naturisa (Power Automate)</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            En Power Automate cree un flujo "Cuando se publica un elemento de fuente" (RSS) con esta dirección y la acción "Enviar un
            correo electrónico (V2)" de Outlook. Los avisos salen desde su buzón. No comparta esta dirección.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input readOnly value={enlace} onFocus={(e) => e.target.select()} aria-label="Dirección de la lista de avisos" className={`${CLASE_CONTROL} min-w-0 flex-1 font-mono text-xs`} />
            <button type="button" onClick={copiar} disabled={!estado || ocupado} className={BOTON_SECUNDARIO}>
              <Copy size={14} /> Copiar
            </button>
            <button type="button" onClick={cambiarClave} disabled={!estado || ocupado} className={BOTON_SECUNDARIO} title="Generar una dirección nueva">
              <RefreshCw size={14} /> Nueva
            </button>
          </div>
        </section>

        {/* Envío directo desde el servidor (solo si tiene una cuenta SMTP) */}
        {estado?.correoConfigurado && (
          <section className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <CheckCircle2 size={15} className="text-emerald-600" /> Envío directo desde {estado.remitente}
            </h3>
            <Campo etiqueta="Enviar a (separe varios correos con ;)" className="mt-2">
              <input value={para} onChange={(e) => setPara(e.target.value)} placeholder="nombre@naturisa.com; otro@naturisa.com" className={CLASE_CONTROL} />
            </Campo>
          </section>
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
